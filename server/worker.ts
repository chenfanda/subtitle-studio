import { Worker } from 'bullmq';
import { fork } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Redis } from 'ioredis';
import treeKill from 'tree-kill'; 
import { connection, type RenderJobData, redisConfig } from './queue';
import { hasGpu } from './gpu-utils';


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
    const { project, jobId, exportSettings } = job.data;
    
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, 'render.ts');
      
      
      const safeJobId = jobId.replace(/[^a-zA-Z0-9-]/g, ''); 
      const jobTempDir = path.join(process.cwd(), 'temp', safeJobId);
      
      if (!fs.existsSync(jobTempDir)) {
        fs.mkdirSync(jobTempDir, { recursive: true });
      }

      
      const child = fork(scriptPath, [], {
        env: { 
          ...process.env, 
          IS_RENDER_CHILD: 'true',
          
          TMPDIR: jobTempDir,
          TEMP: jobTempDir,
          TMP: jobTempDir,
          XDG_CACHE_HOME: path.join(jobTempDir, '.cache'),
          npm_config_cache: path.join(jobTempDir, '.npm'),
          remotion_user_data_dir: jobTempDir, 
        },
        execArgv: process.execArgv, 
        detached: true 
      });

      let childBundlePath: string | null = null;
      let checkInterval: NodeJS.Timeout;

      const cleanupResources = () => {
        subscriber.off('message', cancelHandler);
        if (checkInterval) clearInterval(checkInterval);
      };

      const forceCleanupFiles = () => {
        setTimeout(() => {
          
          if (jobTempDir.includes('temp') && fs.existsSync(jobTempDir)) {
            try {
              fs.rmSync(jobTempDir, { recursive: true, force: true });
              console.log(`🧹 [Worker] 沙盒清理完成: ${jobId}`);
            } catch (e: any) {
              console.error(`⚠️ [Worker] 沙盒清理受阻: ${e.message}`);
            }
          }
          
          if (childBundlePath && fs.existsSync(childBundlePath)) {
             try {
               if (!childBundlePath.startsWith(jobTempDir)) {
                 fs.rmSync(childBundlePath, { recursive: true, force: true });
               }
             } catch (e) {}
          }
        }, 2000);
      };

      
      const performKill = async () => {
        if (child.pid) {
          console.log(`🛑 [Worker] 正在停止进程树 PID: ${child.pid}`);
          
          
          await killProcessTree(child.pid, 'SIGTERM');
          
          
          await sleep(3000);
          
          
          await killProcessTree(child.pid, 'SIGKILL');
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
          job.updateProgress(msg.value).catch(() => {});
        }
      });

      child.on('exit', (code) => {
        cleanupResources();
        if (code !== 0) {
        
        }
      });

      child.on('error', async (err) => {
        cleanupResources();
        await performKill();
        reject(err);
      });

      child.send({ type: 'start', project, jobId ,exportSettings});

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