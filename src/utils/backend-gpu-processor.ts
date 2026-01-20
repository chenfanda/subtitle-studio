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

const DOCKER_IMAGE = 'ffmpeg-cuda:6.1';

const sanitizeForGpuStage = (originalProject: ProjectExport, keepOverlays: boolean): ProjectExport => {
  const cleanProject = JSON.parse(JSON.stringify(originalProject));

  if (!keepOverlays) {
    cleanProject.content.subtitles = []; 
    // cleanProject.content.textElements = [];
    // cleanProject.content.placedMedia = []; 
  }

  // if (cleanProject.settings?.watermark && !keepOverlays) {
  //   cleanProject.settings.watermark.enabled = false;
  // }
  
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
    const tempDir = path.resolve(path.join(process.cwd(), 'temp', jobId));
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const outputFilename = 'base_video.mp4';
    const outputPath = path.join(tempDir, outputFilename);

    const hostUploadDir = path.resolve(SERVER_CONFIG.PATHS.UPLOAD_DIR);
    const hostFontDir = path.resolve(path.join(process.cwd(), 'public', 'fonts'));

    const backendContext = {
      uploadDir: hostUploadDir,
      fontDir: hostFontDir
    };

    const isFastPath = canUsePureFFmpeg(project);
    
    if (isFastPath) {
        console.log(`🚀 [GPU Mode] Fast Path`);
    } else {
        console.log(`🐢 [GPU Mode] Hybrid Path`);
    }

    const stage1Project = sanitizeForGpuStage(project, isFastPath);

    if (!isFastPath) {
      project.content.textElements = [];
      project.content.placedMedia = []; 
    }

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

    const ffmpegArgs: string[] = [];

    mapper.remoteUrls.forEach(input => {
       ffmpegArgs.push('-i', input.localPath);
    });

    const filterAndOutputArgs = [...command];

    const lastArg = filterAndOutputArgs[filterAndOutputArgs.length - 1];
    if (lastArg === 'output.mp4' || lastArg === 'output.gif') {
        filterAndOutputArgs.pop();
    }

    ffmpegArgs.push(...filterAndOutputArgs);

    ffmpegArgs.unshift('-y');
    ffmpegArgs.push(outputPath);

    const dockerArgs = [
      'run', 
      '--rm', 
      '--gpus', 'all',
      '-w', '/',
      '-v', `${tempDir}:${tempDir}`,
      '-v', `${hostUploadDir}:${hostUploadDir}:ro`,
      '-v', `${hostFontDir}:${hostFontDir}:ro`,
      '-v', `${hostFontDir}:/public/fonts:ro`,
      DOCKER_IMAGE,
      ...ffmpegArgs
    ];

    // console.log(`🐳 [GPU Docker] Executing: docker ${dockerArgs.join(' ')}`);
    console.log(`🐳 [GPU Docker] Executing!`);

    const ffmpegProcess = spawn('docker', dockerArgs);

    let stderrData = '';
    ffmpegProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ [GPU Stage 1] Success: ${outputPath}`);
        resolve({ outputPath, isFinished: isFastPath });
      } else {
        console.error(`❌ [GPU Stage 1] Failed with code ${code}`);
        console.error(`[FFmpeg Error Log]: ${stderrData.slice(-2000)}`); 
        reject(new Error(`FFmpeg GPU process exited with code ${code}`));
      }
    });

    ffmpegProcess.on('error', (err) => {
      console.error(`❌ [Docker Error] Failed to start docker process:`, err);
      reject(err);
    });
  });
};


export const mergeFramesWithGpu = async (
  tempDir: string,
  framesDir: string,
  fps: number,
  outputPath: string
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const absoluteTempDir = path.resolve(tempDir);
    const absoluteFramesDir = path.resolve(framesDir);
    const absoluteOutputDir = path.resolve(path.dirname(outputPath));

    const hostUploadDir = path.resolve(SERVER_CONFIG.PATHS.UPLOAD_DIR);
    const hostFontDir = path.resolve(path.join(process.cwd(), 'public', 'fonts'));

    const ffmpegArgs = [
      '-y',
      '-i', path.join(absoluteTempDir, 'base_video.mp4'), 
      '-framerate', fps.toString(),
      '-pattern_type', 'glob', 
      '-i', path.join(absoluteFramesDir, '*.png'), 
      '-filter_complex', '[0:v][1:v]overlay=0:0[v]',
      '-map', '[v]',
      '-map', '0:a',
      '-c:v', 'h264_nvenc',
      '-preset', 'p4',
      '-cq', '22',
      '-pix_fmt', 'yuv420p',
      outputPath
    ];

    const dockerArgs = [
      'run', '--rm', '--gpus', 'all',
      '-w', '/',
      '-v', `${absoluteTempDir}:${absoluteTempDir}`,
      '-v', `${absoluteOutputDir}:${absoluteOutputDir}`,
      '-v', `${hostUploadDir}:${hostUploadDir}:ro`,
      '-v', `${hostFontDir}:${hostFontDir}:ro`,
      '-v', `${hostFontDir}:/public/fonts:ro`,
      DOCKER_IMAGE,
      ...ffmpegArgs
    ];

    console.log(`🐳 [GPU Docker] 开始 Stage 3 最终合成...`);
    const ffmpegProcess = spawn('docker', dockerArgs);

    let stderrData = '';
    ffmpegProcess.stderr.on('data', (data) => { stderrData += data.toString(); });

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ [GPU Stage 3] 合成成功: ${outputPath}`);
        resolve();
      } else {
        console.error(`❌ [GPU Stage 3] 合成失败 Code: ${code}`);
        console.error(`[FFmpeg Error Log]: ${stderrData.slice(-1000)}`);
        reject(new Error(`FFmpeg GPU merge process exited with code ${code}`));
      }
    });

    ffmpegProcess.on('error', (err) => {
      console.error(`❌ [Docker Error]`, err);
      reject(err);
    });
  });
};