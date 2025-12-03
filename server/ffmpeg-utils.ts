import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs/promises'; 
import { existsSync } from 'fs'; 

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
      '-g', '1',
      '-keyint_min', '1',
      '-tune', 'fastdecode', 
      '-sc_threshold', '0',
      '-pix_fmt', 'yuv420p',
      '-crf', '18',
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

export const concatVideoParts = async (
  videoParts: string[], 
  audioPath: string, 
  outputPath: string
) => {
  console.log(`🧩 [Merger] 开始合并 ${videoParts.length} 个视频片段和音频...`);


  const listContent = videoParts
    .map(p => `file '${p}'`)
    .join('\n');
  
  const listPath = path.join(path.dirname(videoParts[0]), 'concat_list.txt');
  await fs.writeFile(listPath, listContent);


  const args = [
    '-f', 'concat',
    '-safe', '0',
    '-i', listPath,
    '-i', audioPath,
    '-c:v', 'copy', 
    '-c:a', 'aac', 
    '-b:a', '192k',
    '-map', '0:v',
    '-map', '1:a',
    '-shortest',
    '-movflags', '+faststart',
    '-y',
    outputPath
  ];

  try {
    await execFileAsync(FFMPEG_PATH, args);
    console.log(`✅ [Merger] 合并完成`);
  } catch (error) {
    console.error(`❌ [Merger] 合并失败`, error);
    throw error;
  } finally {
    
    if (existsSync(listPath)) {
      await fs.unlink(listPath).catch(() => {});
    }
  }
};