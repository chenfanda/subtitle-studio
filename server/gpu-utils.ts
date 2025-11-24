import { execSync } from 'child_process';
import type { RenderMediaOptions } from '@remotion/renderer';

export const hasGpu = (): boolean => {
  try {
    execSync('nvidia-smi', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
};

export const getCodecConfig = (): {
  codec: RenderMediaOptions['codec'];
  ffmpegOverride: RenderMediaOptions['ffmpegOverride'];
} => {
  return {
    codec: 'h264',
    ffmpegOverride: ({ args }) => {
      return args;
    }
  };
};