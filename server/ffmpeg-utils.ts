import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs/promises'; 

const execFileAsync = promisify(execFile);

const FFMPEG_PATH = path.join(
  process.cwd(),
  'node_modules',
  '@remotion',
  'compositor-linux-x64-gnu',
  'ffmpeg'
);


const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];

export const optimizeVideo = async (inputPath: string, outputPath: string) => {
  const filename = path.basename(inputPath);
  const ext = path.extname(inputPath).toLowerCase();

  console.log(`🔄 [Processor] 开始处理素材: ${filename}`);

  
  if (!VIDEO_EXTENSIONS.includes(ext)) {
    console.log(`⏩ [Processor] 跳过非视频文件清洗 (直接复制): ${filename}`);
    try {
      await fs.copyFile(inputPath, outputPath);
      return;
    } catch (error) {
      console.error(`❌ [Processor] 文件复制失败`, error);
      throw error;
    }
  }

  try {
    await execFileAsync(FFMPEG_PATH, [
      '-y',
      '-i', inputPath,
      '-c:v', 'libx264',
      '-profile:v', 'high',
      '-g', '30',
      '-keyint_min', '30',
      '-sc_threshold', '0',
      '-pix_fmt', 'yuv420p',
      '-crf', '23',
      '-preset', 'veryfast',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputPath
    ]);
    console.log(`✅ [Processor] 视频清洗成功`);
  } catch (error) {
    console.error(`❌ [Processor] FFmpeg 执行出错`, error);
    throw error;
  }
};