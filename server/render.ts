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

const handleTermination = (signal: string) => {
  try {
    if (currentTempDir && fs.existsSync(currentTempDir)) {
      fs.rmSync(currentTempDir, { recursive: true, force: true });
    }
    if (currentBundlePath && fs.existsSync(currentBundlePath)) {
      fs.rmSync(currentBundlePath, { recursive: true, force: true });
    }
  } catch (e) {
  }
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

    const outputLocation = path.join(process.cwd(), 'public', 'downloads', `${jobId}.mp4`);
    const codecConfig = getCodecConfig();
    const fps = composition.fps || 30;
    const durationInFrames = calculateDurationInFrames(project, fps);
    
    if (durationInFrames > 0) {
      composition.durationInFrames = durationInFrames;
    }

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      outputLocation,
      inputProps: { project },
      codec: 'h264',
      audioCodec: 'aac',
      chromiumOptions: {
        headless: true, 
        ignoreCertificateErrors: true,
        userDataDir: tempDir,
        concurrency: Math.max(2, os.cpus().length - 1),
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-gpu-rasterization', '--enable-zero-copy']
      },
      ...(codecConfig.ffmpegOverride ? { ffmpegOverride: codecConfig.ffmpegOverride } : {}),
      concurrency: 1,
      onProgress: ({ progress }: { progress: number }) => {
        if (onProgress) onProgress(Math.round(progress * 100));
      },
      tries: 1,
    } as any);

    return `/downloads/${jobId}.mp4`;

  } finally {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      
      if (bundleLocation && fs.existsSync(bundleLocation)) {
        fs.rmSync(bundleLocation, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      console.error(`Cleanup failed for job ${jobId}:`, cleanupErr);
    }
  }
};

if (process.env.IS_RENDER_CHILD === 'true') {
  process.on('message', async (msg: any) => {
    if (msg.type === 'start') {
      const { project, jobId } = msg;
      try {
        const url = await renderVideo(project, jobId, (progress) => {
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