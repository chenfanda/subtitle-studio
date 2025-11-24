import { api } from '@/utils/api';
import { fileUploader } from '@/utils/cloudUploader';
import type { ProjectExport } from '@/types/project';

const checkAbort = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    throw new Error('Aborted');
  }
};

function collectUploadTasks(content: ProjectExport['content']) {
  const tasks: { obj: any; key: string; url: string }[] = [];

  const checkAndAdd = (obj: any, key: string) => {
    if (obj && obj[key] && typeof obj[key] === 'string' && obj[key].startsWith('blob:')) {
      tasks.push({ obj, key, url: obj[key] });
    }
  };

  content.videoSequenceSegments?.forEach(seg => checkAndAdd(seg, 'sourceUrl'));
  content.placedMedia?.forEach(item => checkAndAdd(item.media, 'url'));
  
  content.subtitles?.forEach(sub => {
    if (sub.brollVideo) checkAndAdd(sub.brollVideo.video, 'url');
    if (sub.audioTrack) checkAndAdd(sub.audioTrack.track, 'url');
    if (sub.soundEffect) checkAndAdd(sub.soundEffect.track, 'url');
  });

  if (content.backgroundMusic) {
    checkAndAdd(content.backgroundMusic, 'url');
  }

  return tasks;
}

export const prepareProjectForExport = async (
  project: ProjectExport,
  onProgress?: (percent: number, msg: string) => void,
  signal?: AbortSignal
): Promise<ProjectExport> => {
  const serverReadyProject = JSON.parse(JSON.stringify(project));
  const tasks = collectUploadTasks(serverReadyProject.content);
  const total = tasks.length;
  
  if (total === 0) {
    onProgress?.(1, '资源准备就绪');
    return serverReadyProject;
  }

  let completedCount = 0;

  for (let i = 0; i < total; i++) {
    checkAbort(signal);
    const task = tasks[i];
    
    onProgress?.(
      (completedCount / total) * 0.9, 
      `正在上传资源 (${completedCount + 1}/${total})`
    );

    const uploadedUrl = await fileUploader.uploadBlob(
      task.url, 
      'media',
      (filePercent) => {
        const totalPercent = (completedCount + filePercent) / total;
        onProgress?.(totalPercent * 0.9, `正在上传资源 (${completedCount + 1}/${total})`);
      },
      signal
    );

    task.obj[task.key] = uploadedUrl;
    completedCount++;
  }

  checkAbort(signal);
  return serverReadyProject;
};

export const runBackendExport = async (
  project: ProjectExport,
  onProgress?: (percent: number, msg: string) => void,
  signal?: AbortSignal
): Promise<string> => {
  
  onProgress?.(0, '正在分析资源...');
  
  const serverReadyProject = await prepareProjectForExport(project, onProgress, signal);
  
  checkAbort(signal);
  onProgress?.(0.95, '正在提交渲染任务...');
  
  const { jobId } = await api.startExportJob(serverReadyProject, signal);
  
  return jobId;
};