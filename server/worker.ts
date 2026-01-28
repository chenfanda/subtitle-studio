import { Worker } from 'bullmq';
import { fork } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Redis } from 'ioredis';
import treeKill from 'tree-kill';
import { connection, type RenderJobData, redisConfig } from './queue';
import { hasGpu } from './gpu-utils';

import { processWithGpu, convertFormatWithGpu } from '../src/utils/backend-gpu-processor';
import { SERVER_CONFIG } from './config/server-config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONCURRENCY = hasGpu() ? 5 : 2;
const CANCEL_CHANNEL = 'RENDER_CANCEL_CHANNEL';

console.log(`👷 [Worker] 启动渲染守护进程 (Queue并发: ${CONCURRENCY})`);

const subscriber = new Redis(redisConfig);
subscriber.subscribe(CANCEL_CHANNEL);


const killProcessTree = (pid: number, signal: string): Promise<void> => {
  return new Promise((resolve) => {
    treeKill(pid, signal, (err) => {
      if (err) {

        console.error(`⚠️ Kill tree error (pid=${pid}): ${err.message}`);
      }
      resolve();
    });
  });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const worker = new Worker<RenderJobData>(
  'video-render-queue',
  async (job) => {
    const { project, jobId, userId, exportSettings } = job.data;

    return new Promise(async (resolve, reject) => {
      let activePid: number | undefined = undefined;
      let childBundlePath: string | null = null;
      let checkInterval: NodeJS.Timeout | null = null;
      const safeJobId = jobId.replace(/[^a-zA-Z0-9-]/g, '');
      const jobTempDir = path.join(process.cwd(), 'temp', safeJobId);

      const cleanupResources = () => {
        subscriber.off('message', cancelHandler);
        if (checkInterval) clearInterval(checkInterval);
      };

      const forceCleanupFiles = () => {
        setTimeout(() => {
          if (fs.existsSync(jobTempDir)) {
            try {
              fs.rmSync(jobTempDir, { recursive: true, force: true });
              console.log(`🧹 [Worker] 任务沙盒清理完成: ${jobId}`);
            } catch (e: any) {
              console.error(`⚠️ [Worker] 沙盒清理受阻: ${e.message}`);
            }
          }

          const parentDir = path.join(process.cwd(), 'temp');
          const SEVEN_DAYS_MS = 24 * 60 * 60 * 1000;
          if (fs.existsSync(parentDir)) {
            try {
              const files = fs.readdirSync(parentDir);
              const now = Date.now();
              files.forEach(file => {
                if (file.startsWith('remotion-') || file.startsWith('react-motion-')) {
                  const fullPath = path.join(parentDir, file);
                  const stats = fs.statSync(fullPath);
                  if (file.includes(jobId) || (now - stats.mtimeMs > SEVEN_DAYS_MS)) {
                    fs.rmSync(fullPath, { recursive: true, force: true });
                  }
                }
              });
            } catch (e) { }
          }
          if (childBundlePath && fs.existsSync(childBundlePath)) {
            try {
              fs.rmSync(childBundlePath, { recursive: true, force: true });
            } catch (e) { }
          }
        }, 2000);
      };

      const performKill = async () => {
        if (activePid) {
          console.log(`🛑 [Worker] 正在停止进程树 PID: ${activePid}`);
          await killProcessTree(activePid, 'SIGTERM');
          await sleep(3000);
          await killProcessTree(activePid, 'SIGKILL');
        }
        forceCleanupFiles();
      };

      const cancelHandler = async (channel: string, message: string) => {
        if (channel === CANCEL_CHANNEL && message === jobId) {
          console.log(`🛑 [Worker] 收到取消指令 Job: ${jobId}`);
          cleanupResources();
          await performKill();
          reject(new Error('CANCELLED_BY_USER'));
        }
      };

      subscriber.on('message', cancelHandler);

      // Early feedback: Task received and being analyzed
      await job.updateProgress(2).catch(() => { });

      const scriptPath = path.join(__dirname, 'render.ts');

      if (!fs.existsSync(jobTempDir)) {
        fs.mkdirSync(jobTempDir, { recursive: true });
      }

      let preRenderedUrl = '';
      const isGpuAvailable = hasGpu();
      console.log(`🕵️ [DEBUG] Job ${jobId}: hasGpu() 检测结果 = ${isGpuAvailable}`);

      if (isGpuAvailable) {
        try {
          console.log(`🚀 [Worker] 检测到 GPU，开始 Stage 1 预处理... Job: ${jobId}`);
          await job.updateProgress(5);

          const safeSettings = exportSettings || { resolution: 1080, format: 'mp4', forceBackend: false };

          const gpuResult = await processWithGpu(project, jobId, safeSettings, (p) => {
            activePid = p.pid;
          });
          activePid = undefined; // Process ended normally

          const port = SERVER_CONFIG.PORT;
          const generatedUrl = `http://localhost:${port}/temp/${jobId}/base_video.mp4`;

          if (gpuResult.isFinished) {
            console.log(`✅ [Worker] 快车道渲染完成，跳过 Remotion。URL: ${generatedUrl}`);
            const targetFormat = safeSettings.format || 'mp4';
            let finalUrl = `http://localhost:${port}/temp/${jobId}/base_video.mp4`;

            if (targetFormat !== 'mp4') {
              console.log(`🔄 [Step 4] 进入格式转换流程: ${targetFormat}`);
              await job.updateProgress(95);

              const mp4Path = gpuResult.outputPath;
              const finalFileName = `final_output.${targetFormat}`;
              const finalPath = path.join(jobTempDir, finalFileName);

              await convertFormatWithGpu(mp4Path, finalPath, targetFormat, (p) => {
                activePid = p.pid;
              });
              activePid = undefined;

              finalUrl = `http://localhost:${port}/temp/${jobId}/${finalFileName}`;
            }
            await job.updateProgress(100);
            cleanupResources();
            resolve({ url: finalUrl });
            return;
          }

          preRenderedUrl = generatedUrl;
          console.log(`✅ [Worker] Stage 1 完成，底板 URL: ${preRenderedUrl}`);
          await job.updateProgress(15);

        } catch (e: any) {
          activePid = undefined;
          if (e.message === 'CANCELLED_BY_USER') return; // Handled by cancelHandler
          console.error(`⚠️ [Worker] GPU 预处理失败，降级回 CPU 全量渲染: ${e.message}`);
          console.error(e.stack);
        }
      }

      await job.updateProgress(10).catch(() => { });
      const remotionProject = JSON.parse(JSON.stringify(project));

      if (preRenderedUrl) {
        remotionProject.preRenderedVideoUrl = preRenderedUrl;
        console.log(`💉 [DEBUG] 成功注入 preRenderedVideoUrl: ${preRenderedUrl}`);
      } else {
        console.log(`👻 [DEBUG] preRenderedVideoUrl 为空，前端将渲染 RenderMask (可能出现白色遮挡)`);
      }

      const child = fork(scriptPath, [], {
        env: {
          ...process.env,
          IS_RENDER_CHILD: 'true',
          IS_GPU_AVAILABLE: isGpuAvailable ? 'true' : 'false',
          TMPDIR: jobTempDir,
          TEMP: jobTempDir,
          TMP: jobTempDir,
          XDG_CACHE_HOME: path.join(jobTempDir, '.cache'),
          npm_config_cache: path.join(jobTempDir, '.npm'),
          remotion_user_data_dir: jobTempDir,
        },
        execArgv: process.execArgv,
        detached: false,
        stdio: 'inherit'
      });

      activePid = child.pid;

      child.on('message', (msg: any) => {
        if (msg.type === 'bundle_path') {
          childBundlePath = msg.path;
        } else if (msg.type === 'success') {
          cleanupResources();
          resolve({ url: msg.url });
        } else if (msg.type === 'error') {
          cleanupResources();
          reject(new Error(msg.message));
        } else if (msg.type === 'progress') {
          const progressValue = typeof msg.value === 'number' ? msg.value : 0;
          const adjustedProgress = preRenderedUrl
            ? 15 + (progressValue * 0.85) // GPU path: scale child progress
            : progressValue;              // CPU path: use child absolute progress

          job.updateProgress(Math.min(98, Math.round(adjustedProgress))).catch(() => { });
        }
      });

      child.on('exit', (code) => {
        activePid = undefined;
        cleanupResources();
      });

      child.on('error', async (err) => {
        activePid = undefined;
        cleanupResources();
        await performKill();
        reject(err);
      });

      child.send({ type: 'start', project: remotionProject, jobId, userId, exportSettings });

      checkInterval = setInterval(async () => {
        try {
          const isActive = await job.isActive();
          if (!isActive) {
            console.log(`🛑 [Worker] 任务状态变为非活跃，执行清理`);
            cleanupResources();
            await performKill();
            reject(new Error('JOB_CANCELLED_BY_USER'));
          }
        } catch (e) {
        }
      }, 3000);
    });
  },
  {
    connection,
    concurrency: CONCURRENCY,
    lockDuration: 30000,
  }
);