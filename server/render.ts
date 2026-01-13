import path from 'path';
import fs from 'fs';
import { bundle, WebpackOverrideFn } from '@remotion/bundler';
import { renderFrames, selectComposition } from '@remotion/renderer';
import { mergeFramesWithGpu } from '../src/utils/backend-gpu-processor';
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

export const renderVideo = async (
  rawProject: ProjectExport, 
  jobId: string,
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

    bundleLocation = await bundle({ 
      entryPoint, 
      webpackOverride, 
      publicDir: path.join(process.cwd(), 'public') 
    });
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

    const fps = composition.fps || 30;
    const durationInFrames = calculateDurationInFrames(project, fps);
    if (durationInFrames > 0) {
      composition.durationInFrames = durationInFrames;
    }

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
      onFrameRendered: ({ frame }: { frame: number }) => {
        if (onProgress) {
          const progress = Math.round((frame / composition.durationInFrames) * 90);
          onProgress(progress);
        }
      },
    } as any);

    const sampleFiles = fs.readdirSync(framesDir);
    console.log(`📂 [Debug] 截图完成，首个文件: ${sampleFiles[0]}, 总数: ${sampleFiles.length}`);

    const finalVideoPath = path.join(process.cwd(), 'public', 'downloads', `${jobId}.mp4`);
    await mergeFramesWithGpu(tempDir, framesDir, fps, finalVideoPath);

    if (onProgress) onProgress(100);

    return `/downloads/${jobId}.mp4`;

  } finally {
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