import path from 'path';
import fs from 'fs';
import { bundle, WebpackOverrideFn } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { getCodecConfig } from './gpu-utils';
import type { ProjectExport } from '../src/types/project';
import os from 'os';

const API_PORT = process.env.PORT || 8000;
const API_BASE_URL = `http://localhost:${API_PORT}`;

let currentTempDir: string | null = null;
let currentBundlePath: string | null = null;

interface ExportSettings {
  resolution: number;
  format: 'mp4' | 'gif';
}

// 辅助函数：等待
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 🔥 优化 1: 暴力清理函数 (解决文件锁导致的删除失败)
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
        await sleep(500); // 等待文件锁释放
      }
    }
  }
};

const handleTermination = async (signal: string) => {
  // 🔥 优化 2: 使用异步清理
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
  return project;
};

export const renderVideo = async (
  rawProject: ProjectExport, 
  jobId: string,
  exportSettings?: ExportSettings, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  
  const tempDir = path.join(process.cwd(), 'temp', jobId);
  currentTempDir = tempDir;

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  let bundleLocation: string | null = null;

  try {
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

    bundleLocation = await bundle({ entryPoint, webpackOverride });
    currentBundlePath = bundleLocation;
    
    if (process.send && bundleLocation) {
      process.send({ type: 'bundle_path', path: bundleLocation });
    }

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'MainVideo',
      inputProps: { project }, 
      chromiumOptions: {
        headless: true
      }
    });

    let scale = 1;
    if (exportSettings?.resolution && composition.height) {
      scale = exportSettings.resolution / composition.height;
    }

    const outputLocation = path.join(process.cwd(), 'public', 'downloads', `${jobId}.mp4`);
    const codecConfig = getCodecConfig();
    const fps = composition.fps || 30;
    const durationInFrames = calculateDurationInFrames(project, fps);
    
    if (durationInFrames > 0) {
      composition.durationInFrames = durationInFrames;
    }

    const cpuCount = os.cpus().length;
    const optimalConcurrency = Math.max(1, cpuCount - 1); 

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      outputLocation,
      inputProps: { project },
      scale,
      codec: 'h264',
      audioCodec: 'aac',
      chromiumOptions: {
        headless: true, 
        ignoreCertificateErrors: true,
        // 🔥 优化 3: 删除了 userDataDir: tempDir
        // 这避免了高并发下 Chrome 实例争抢同一个文件夹导致崩溃
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox', 
          '--enable-gpu-rasterization', 
          '--enable-zero-copy',
          '--disable-dev-shm-usage' // 增加这个参数防止 Docker 内存不足
        ]
      },
      ...(codecConfig.ffmpegOverride ? { ffmpegOverride: codecConfig.ffmpegOverride } : {}),
      concurrency: optimalConcurrency,
      onProgress: ({ progress }: { progress: number }) => {
        if (onProgress) onProgress(Math.round(progress * 100));
      },
      tries: 1,
    } as any);

    return `/downloads/${jobId}.mp4`;

  } finally {
    // 🔥 优化 4: 使用重试删除
    if (currentTempDir) await deleteWithRetry(currentTempDir);
    if (currentBundlePath) await deleteWithRetry(currentBundlePath);
  }
};

if (process.env.IS_RENDER_CHILD === 'true') {
  process.on('message', async (msg: any) => {
    if (msg.type === 'start') {
      const { project, jobId , exportSettings } = msg;
      try {
        const url = await renderVideo(project, jobId, exportSettings,(progress) => {
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