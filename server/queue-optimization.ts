import { Queue, Worker } from 'bullmq';
import path from 'path';
import { connection } from './queue';
import { optimizeVideo } from './ffmpeg-utils';

export const optimizationQueue = new Queue('video-optimization-queue', { connection });

const worker = new Worker('video-optimization-queue', async (job) => {
  const { filePath, fileName } = job.data;
  const uploadDir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  
  const optimizedFileName = `${baseName}_opt${ext}`;
  const optimizedFilePath = path.join(uploadDir, optimizedFileName);

  try {
    await optimizeVideo(filePath, optimizedFilePath);
    return { 
      url: `/uploads/${optimizedFileName}`,
      originalUrl: `/uploads/${fileName}`
    };
  } catch (error) {
    // 失败降级逻辑
    return { 
      url: `/uploads/${fileName}`,
      originalUrl: `/uploads/${fileName}`
    };
  }
}, { connection, concurrency: 2 });