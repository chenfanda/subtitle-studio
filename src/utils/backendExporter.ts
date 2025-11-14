import { api } from '@/utils/api';
import { fileUploader } from '@/utils/cloudUploader';
import type { ProjectExport } from '@/types/project';

// (修改) 这是一个新的辅助函数，用于递归上传所有 blob
async function uploadAllBlobs(projectContent: ProjectExport['content']) {
  const uploadTasks: Promise<any>[] = [];

  const processUrl = async (obj: any, key: string) => {
    if (obj[key] && typeof obj[key] === 'string' && obj[key].startsWith('blob:')) {
      const blobUrl = obj[key];
      // 上传 blob 并替换 URL
      obj[key] = await fileUploader.uploadBlob(blobUrl, 'media');
    }
  };

  // 1. 遍历视频序列
  if (projectContent.videoSequenceSegments) {
    for (const seg of projectContent.videoSequenceSegments) {
      uploadTasks.push(processUrl(seg, 'sourceUrl'));
    }
  }
  
  // 2. 遍历媒体元素
  if (projectContent.placedMedia) {
    for (const item of projectContent.placedMedia) {
      uploadTasks.push(processUrl(item.media, 'url'));
    }
  }

  // 3. 遍历字幕附件
  if (projectContent.subtitles) {
    for (const sub of projectContent.subtitles) {
      if (sub.brollVideo) {
        uploadTasks.push(processUrl(sub.brollVideo.video, 'url'));
      }
      if (sub.audioTrack) {
        uploadTasks.push(processUrl(sub.audioTrack.track, 'url'));
      }
      if (sub.soundEffect) {
        uploadTasks.push(processUrl(sub.soundEffect.track, 'url'));
      }
    }
  }

  // 4. 处理背景音乐
  if (projectContent.backgroundMusic) {
    uploadTasks.push(processUrl(projectContent.backgroundMusic, 'url'));
  }
  
  // 等待所有上传任务完成
  await Promise.all(uploadTasks);
}

/**
 * 遍历 Project JSON, 上传所有 blob: URL, 并返回一个 "服务器就绪" 的 JSON
 */
export const prepareProjectForExport = async (project: ProjectExport): Promise<ProjectExport> => {
  const serverReadyProject = JSON.parse(JSON.stringify(project));
  
  // (修改) 调用新的辅助函数来处理所有媒体
  await uploadAllBlobs(serverReadyProject.content);

  return serverReadyProject;
};


/**
 * 触发后端导出
 */
export const runBackendExport = async (project: ProjectExport): Promise<string> => {
  
  const serverReadyProject = await prepareProjectForExport(project);
  
  const { jobId } = await api.startExportJob(serverReadyProject);
  
  return jobId;
};