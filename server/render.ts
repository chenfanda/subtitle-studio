import path from 'path';
import fs from 'fs';
import { bundle, WebpackOverrideFn } from '@remotion/bundler';
import { renderFrames, selectComposition } from '@remotion/renderer';
import { mergeFramesWithGpu, convertFormatWithGpu } from '../src/utils/backend-gpu-processor';
import type { ProjectExport } from '../src/types/project';
import os from 'os';
import { spawn } from 'child_process';

const API_PORT = process.env.PORT || 8000;
const API_BASE_URL = `http://localhost:${API_PORT}`;

let currentTempDir: string | null = null;
let currentBundlePath: string | null = null;

interface ExportSettings {
  resolution: number;
  format: 'mp4' | 'gif' | 'mov' | 'avi' | 'mp3';
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const deleteWithRetry = async (dirPath: string, retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
      return;
    } catch (e: any) {
      if (i === retries - 1) {
        console.error(`❌ [Cleanup] 删除失败 ${dirPath}: ${e.message}`);
      } else {
        await sleep(500);
      }
    }
  }
};

const handleTermination = async (signal: string) => {
  if (currentTempDir) await deleteWithRetry(currentTempDir);
  if (currentBundlePath) await deleteWithRetry(currentBundlePath);
  process.exit(0);
};

process.on('SIGTERM', () => handleTermination('SIGTERM'));
process.on('SIGINT', () => handleTermination('SIGINT'));

const calculateDurationInFrames = (project: ProjectExport, fps: number): number => {
  if (project.content?.videoSequenceSegments?.length > 0) {
    const totalDurationMs = project.content.videoSequenceSegments.reduce(
      (sum, seg) => (seg.type !== 'cut' ? sum + seg.duration : sum), 0
    );
    return Math.ceil((totalDurationMs / 1000) * fps);
  }
  if (project.video?.duration) {
    return Math.ceil(project.video.duration * fps);
  }
  return 30 * 10;
};

const normalizeProjectUrls = (rawProject: ProjectExport): ProjectExport => {
  const project = JSON.parse(JSON.stringify(rawProject));
  const fixUrl = (url: string | undefined) => {
    if (url && typeof url === 'string' && url.startsWith('/')) {
      return `${API_BASE_URL}${url}`;
    }
    return url;
  };

  if (project.video?.url) project.video.url = fixUrl(project.video.url);
  if (project.content?.backgroundMusic?.url) project.content.backgroundMusic.url = fixUrl(project.content.backgroundMusic.url);

  if (Array.isArray(project.content?.videoSequenceSegments)) {
    project.content.videoSequenceSegments = project.content.videoSequenceSegments.map((seg: any) => ({
      ...seg,
      sourceUrl: fixUrl(seg.sourceUrl)
    }));
  }
  if (Array.isArray(project.content?.placedMedia)) {
    project.content.placedMedia = project.content.placedMedia.map((item: any) => {
      if (item.media?.url) item.media.url = fixUrl(item.media.url);
      return item;
    });
  }
  if (Array.isArray(project.content?.subtitles)) {
    project.content.subtitles = project.content.subtitles.map((sub: any) => {
      if (sub.brollVideo?.video?.url) sub.brollVideo.video.url = fixUrl(sub.brollVideo.video.url);
      if (sub.audioTrack?.track?.url) sub.audioTrack.track.url = fixUrl(sub.audioTrack.track.url);
      if (sub.soundEffect?.track?.url) sub.soundEffect.track.url = fixUrl(sub.soundEffect.track.url);
      return sub;
    });
  }
  if (project.settings?.watermark?.snapshotUrl) {
    project.settings.watermark.snapshotUrl = fixUrl(project.settings.watermark.snapshotUrl);
  }
  return project;
};

const mergeFramesWithCpu = async (
  tempDir: string,
  framesDir: string,
  fps: number,
  outputPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Find absolute paths
    const absoluteTempDir = path.resolve(tempDir);
    const absoluteFramesDir = path.resolve(framesDir);
    const hostFfmpegPath = path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-linux-x64-gnu', 'ffmpeg');

    const args = [
      '-y',
      '-i', path.join(absoluteTempDir, 'base_video.mp4'),
      '-framerate', fps.toString(),
      '-pattern_type', 'glob',
      '-i', path.join(absoluteFramesDir, '*.png'),
      '-filter_complex', '[0:v][1:v]overlay=0:0[v]',
      '-map', '[v]',
      '-map', '0:a',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      outputPath
    ];

    console.log(`📡 [CPU Merger] Starting fallback synthesis with host FFmpeg...`);
    const ffmpegProcess = spawn(hostFfmpegPath, args);

    let stderrData = '';
    ffmpegProcess.stderr.on('data', (data) => { stderrData += data.toString(); });

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ [CPU Merger] Synthesis successful: ${outputPath}`);
        resolve();
      } else {
        console.error(`❌ [CPU Merger] Synthesis failed Code: ${code}`);
        console.error(`[FFmpeg Error Log]: ${stderrData.slice(-1000)}`);
        reject(new Error(`FFmpeg CPU merge failed with record: ${code}`));
      }
    });

    ffmpegProcess.on('error', (err) => {
      console.error(`❌ [FFmpeg Error]`, err);
      reject(err);
    });
  });
};

export const renderVideo = async (
  rawProject: ProjectExport,
  jobId: string,
  userId: string = 'anonymous',
  exportSettings?: ExportSettings,
  onProgress?: (progress: number) => void
): Promise<string> => {

  const tempDir = path.join(process.cwd(), 'temp', jobId);
  const framesDir = path.join(tempDir, 'frames');
  currentTempDir = tempDir;

  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  let bundleLocation: string | null = null;

  try {
    if (onProgress) onProgress(1);
    const project = normalizeProjectUrls(rawProject);
    const entryPoint = path.join(process.cwd(), 'src', 'remotion', 'index.ts');

    const webpackOverride: WebpackOverrideFn = (currentConfiguration) => {
      return {
        ...currentConfiguration,
        resolve: {
          ...currentConfiguration.resolve,
          alias: {
            ...(currentConfiguration.resolve?.alias || {}),
            '@': path.join(process.cwd(), 'src'),
          },
        },
      };
    };

    if (onProgress) onProgress(5);
    console.log('📦 [Child] Starting Remotion bundling...');
    bundleLocation = await bundle({
      entryPoint,
      webpackOverride,
      publicDir: path.join(process.cwd(), 'public')
    });

    if (onProgress) onProgress(10);
    console.log('📋 [Child] Selecting composition...');
    currentBundlePath = bundleLocation;

    if (process.send && bundleLocation) {
      process.send({ type: 'bundle_path', path: bundleLocation });
    }

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'MainVideo',
      inputProps: { project },
      chromiumOptions: { headless: true }
    });

    if (onProgress) onProgress(15);

    const fps = composition.fps || 30;
    const durationInFrames = calculateDurationInFrames(project, fps);
    if (durationInFrames > 0) {
      composition.durationInFrames = durationInFrames;
    }

    console.log(`🎬 [Child] 开始进入截图循环... 目标总帧数: ${composition.durationInFrames}`);
    const totalFrames = composition.durationInFrames;
    let monitorLastPercent = 15;

    const progressMonitor = setInterval(() => {
      try {
        const files = fs.readdirSync(framesDir);
        const currentCount = files.filter(f => f.endsWith('.png')).length;

        if (currentCount > 0) {
          const rawRatio = currentCount / totalFrames;
          const percent = 15 + Math.round(rawRatio * 80);

          if (percent > monitorLastPercent) {
            monitorLastPercent = percent;
            if (onProgress) onProgress(percent);
          }
        }
      } catch (e) {
      }
    }, 1000);

    await renderFrames({
      composition,
      serveUrl: bundleLocation,
      outputDir: framesDir,
      inputProps: { project },
      imageFormat: 'png',
      concurrency: 6,
      frameName: (f: number) => `${f}`,
      chromiumOptions: {
        headless: true,
        ignoreCertificateErrors: true,
        args: [
          '--no-sandbox',
          '--ignore-gpu-blocklist',
          '--disable-setuid-sandbox',
          '--enable-gpu-rasterization',
          '--enable-zero-copy',
          '--disable-dev-shm-usage'
        ]
      } as any,

      onFrameRendered: () => { },
    } as any);

    clearInterval(progressMonitor);

    const sampleFiles = fs.readdirSync(framesDir);
    console.log(`📂 [Debug] 截图完成，首个文件: ${sampleFiles[0]}, 总数: ${sampleFiles.length}`);

    const downloadDir = path.join(process.cwd(), 'public', 'downloads', userId);
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

    const finalVideoPath = path.join(downloadDir, `${jobId}.mp4`);

    if (process.env.IS_GPU_AVAILABLE === 'true') {
      await mergeFramesWithGpu(tempDir, framesDir, fps, finalVideoPath);
    } else {
      await mergeFramesWithCpu(tempDir, framesDir, fps, finalVideoPath);
    }

    if (onProgress) onProgress(98);

    const targetFormat = exportSettings?.format || 'mp4';
    if (targetFormat !== 'mp4') {
      console.log(`🔄 [Step 4] Remotion渲染完成，开始转换格式: ${targetFormat}`);
      if (onProgress) onProgress(98);

      const finalOutputPath = path.join(downloadDir, `${jobId}.${targetFormat}`);

      try {
        await convertFormatWithGpu(finalVideoPath, finalOutputPath, targetFormat);

        if (onProgress) onProgress(100);
        return `/downloads/${userId}/${jobId}.${targetFormat}`;
      } catch (e) {
        console.error(`[Step 4] 转换失败，降级返回 MP4:`, e);
        return `/downloads/${userId}/${jobId}.mp4`;
      }
    }

    if (onProgress) onProgress(100);

    return `/downloads/${userId}/${jobId}.mp4`;

  } finally {
    if (currentTempDir) await deleteWithRetry(currentTempDir);
    if (currentBundlePath) await deleteWithRetry(currentBundlePath);
  }
};

if (process.env.IS_RENDER_CHILD === 'true') {
  process.on('message', async (msg: any) => {
    if (msg.type === 'start') {
      const { project, jobId, userId, exportSettings } = msg;
      try {
        const url = await renderVideo(project, jobId, userId, exportSettings, (progress) => {
          if (process.send) process.send({ type: 'progress', value: progress });
        });
        if (process.send) process.send({ type: 'success', url });
        setTimeout(() => process.exit(0), 100);
      } catch (error: any) {
        if (process.send) process.send({ type: 'error', message: error.message });
        setTimeout(() => process.exit(1), 100);
      }
    }
  });
}