import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises'; 
import axios from 'axios';
import { buildFfmpegCommand } from './ffmpegCommandBuilder';
import { SERVER_CONFIG } from '../../server/config/server-config';
import type { ProjectExport } from '../types/project';
import type { ExportSettings } from '../stores/useExportStore';
import { canUsePureFFmpeg } from './exportCapabilityUtils';

const SYSTEM_FFMPEG_PATH = '/usr/local/bin/ffmpeg';

const sanitizeForGpuStage = (originalProject: ProjectExport, keepOverlays: boolean): ProjectExport => {
  const cleanProject = JSON.parse(JSON.stringify(originalProject));

  if (!keepOverlays) {
    cleanProject.content.subtitles = []; 
    cleanProject.content.textElements = [];
    cleanProject.content.placedMedia = []; 
  }


  if (cleanProject.settings?.watermark && !keepOverlays) {
    cleanProject.settings.watermark.enabled = false;
  }
  
  return cleanProject;
};

const downloadRemoteAssets = async (
  remoteUrls: { url: string; localPath: string }[], 
  tempDir: string
): Promise<void> => {
  const downloadTasks = remoteUrls.map(async (item, index) => {
    if (!item.url.startsWith('http')) {
      return;
    }
    try {
      const ext = path.extname(item.url.split('?')[0]) || '.dat';
      const localFileName = `downloaded_asset_${index}${ext}`;
      const localFilePath = path.join(tempDir, localFileName);

      console.log(`⬇️ [GPU Stage 1] Downloading: ${item.url}`);

      const response = await axios({
        method: 'GET',
        url: item.url,
        responseType: 'stream'
      });

      await pipeline(response.data, fs.createWriteStream(localFilePath));
      item.localPath = localFilePath;
    } catch (error: any) {
      console.error(`❌ [GPU Stage 1] Download failed: ${item.url}`, error.message);
      throw new Error(`Failed to download asset: ${item.url}`);
    }
  });

  await Promise.all(downloadTasks);
};

export const processWithGpu = async (
  project: ProjectExport,
  jobId: string,
  settings: ExportSettings
): Promise<{ outputPath: string; isFinished: boolean }> => {
  return new Promise(async (resolve, reject) => { 
    const tempDir = path.join(process.cwd(), 'temp', jobId);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const outputFilename = 'base_video.mp4';
    const outputPath = path.join(tempDir, outputFilename);

    const backendContext = {
      uploadDir: SERVER_CONFIG.PATHS.UPLOAD_DIR,
      fontDir: path.join(process.cwd(), 'public', 'fonts')
    };

    // 1. 智能判定：是否可以使用纯 FFmpeg 模式
    const isFastPath = canUsePureFFmpeg(project);
    
    if (isFastPath) {
        console.log(`🚀 [GPU Mode] 判定为简单场景，启用 Fast Path (纯 FFmpeg 渲染)`);
    } else {
        console.log(`🐢 [GPU Mode] 判定为复杂场景，启用 Hybrid Path (FFmpeg + Remotion)`);
    }

    // 2. 根据判定结果清洗数据
    const stage1Project = sanitizeForGpuStage(project, isFastPath);

    const { command, mapper } = buildFfmpegCommand(
      stage1Project,
      settings,
      'backend',
      true,
      backendContext,
      true
    );

    try {
      await downloadRemoteAssets(mapper.remoteUrls, tempDir);
    } catch (e) {
      return reject(e);
    }

    const args: string[] = [];

    mapper.remoteUrls.forEach(input => {
       args.push('-i', input.localPath);
    });

    const filterAndOutputArgs = [...command];

    const lastArg = filterAndOutputArgs[filterAndOutputArgs.length - 1];
    if (lastArg === 'output.mp4' || lastArg === 'output.gif') {
        filterAndOutputArgs.pop();
    }

    args.push(...filterAndOutputArgs);

    args.unshift('-y');
    args.push(outputPath);

    // console.log(`[GPU Stage 1] Executing: ${SYSTEM_FFMPEG_PATH} ${args.join(' ')}`);

    const ffmpegProcess = spawn(SYSTEM_FFMPEG_PATH, args);

    let stderrData = '';
    ffmpegProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ [GPU Stage 1] Success: ${outputPath}`);
        // 返回 isFinished 状态，通知 worker 是否需要跳过 Remotion
        resolve({ outputPath, isFinished: isFastPath });
      } else {
        console.error(`❌ [GPU Stage 1] Failed with code ${code}`);
        console.error(`[FFmpeg Error Log]: ${stderrData.slice(-1000)}`); 
        reject(new Error(`FFmpeg GPU process exited with code ${code}`));
      }
    });

    ffmpegProcess.on('error', (err) => {
      reject(err);
    });
  });
};