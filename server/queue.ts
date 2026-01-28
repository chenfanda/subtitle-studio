import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import type { ProjectExport } from '../src/types/project';

export interface ExportSettings {
  resolution: number;
  format: 'mp4' | 'gif';
  forceBackend: boolean;
}

export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6380'),
  maxRetriesPerRequest: null,
};

export const connection = new Redis(redisConfig);

// 定义任务数据的接口
export interface RenderJobData {
  project: ProjectExport;
  jobId: string;
  userId?: string;
  exportSettings?: ExportSettings;
}

// 创建队列实例
export const renderQueue = new Queue<RenderJobData>('video-render-queue', {
  connection,
});

console.log('🔌 [Server] Redis 队列已连接');