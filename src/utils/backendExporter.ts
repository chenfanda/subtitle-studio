import { api } from '@/utils/api';
import { fileUploader } from '@/utils/cloudUploader';
import type { ProjectExport } from '@/types/project';
import type { ExportSettings } from '@/stores/useExportStore';

const checkAbort = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    throw new Error('Aborted');
  }
};

const resolveUrl = (url: string) => {
  if (url && url.startsWith('/')) {
    return new URL(url, window.location.origin).toString();
  }
  return url;
};

function normalizeProjectUrls(project: ProjectExport) {
  const content = project.content;
  
  if (content.videoSequenceSegments) {
    content.videoSequenceSegments.forEach(seg => {
      if (seg.sourceUrl) seg.sourceUrl = resolveUrl(seg.sourceUrl);
    });
  }

  if (content.placedMedia) {
    content.placedMedia.forEach(item => {
      if (item.media?.url) item.media.url = resolveUrl(item.media.url);
    });
  }
  
  if (content.subtitles) {
    content.subtitles.forEach(sub => {
      if (sub.brollVideo?.video?.url) sub.brollVideo.video.url = resolveUrl(sub.brollVideo.video.url);
      if (sub.audioTrack?.track?.url) sub.audioTrack.track.url = resolveUrl(sub.audioTrack.track.url);
      if (sub.soundEffect?.track?.url) sub.soundEffect.track.url = resolveUrl(sub.soundEffect.track.url);
    });
  }

  if (content.backgroundMusic?.url) {
    content.backgroundMusic.url = resolveUrl(content.backgroundMusic.url);
  }

  if (content.sourceResources) {
    if (content.sourceResources.audioVocals) content.sourceResources.audioVocals = resolveUrl(content.sourceResources.audioVocals);
    if (content.sourceResources.audioBacking) content.sourceResources.audioBacking = resolveUrl(content.sourceResources.audioBacking);
    if (content.sourceResources.video) content.sourceResources.video = resolveUrl(content.sourceResources.video);
  }

  if (project.content.textElements) {
    project.content.textElements.forEach(el => {
      if ((el as any).snapshotUrl) {
        (el as any).snapshotUrl = resolveUrl((el as any).snapshotUrl);
      }
    });
  }

  if (project.settings?.watermark?.snapshotUrl) {
    project.settings.watermark.snapshotUrl = resolveUrl(project.settings.watermark.snapshotUrl);
  }
}

function collectUploadTasks(project: ProjectExport) {
  const tasks: { obj: any; key: string; url: string }[] = [];
  const content = project.content;

  const checkAndAdd = (obj: any, key: string, force: boolean = false) => {
    const url = obj?.[key];
    if (typeof url === 'string') {
      const isBlob = url.startsWith('blob:');
      const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
      
      if (isBlob || (force && isLocalhost)) {
        tasks.push({ obj, key, url });
      }
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

  if (content.sourceResources) {
    checkAndAdd(content.sourceResources, 'audioVocals');
    checkAndAdd(content.sourceResources, 'audioBacking');
  }
  
  if (project.content.textElements) {
    project.content.textElements.forEach(el => {
      checkAndAdd(el, 'snapshotUrl'); 
    });
  }

  if (project.settings?.watermark?.snapshotUrl) {
    checkAndAdd(project.settings.watermark, 'snapshotUrl');
  }

  return tasks;
}

export const prepareProjectForExport = async (
  project: ProjectExport,
  onProgress?: (percent: number, msg: string) => void,
  signal?: AbortSignal
): Promise<ProjectExport> => {
  const serverReadyProject = JSON.parse(JSON.stringify(project));
  
  
  normalizeProjectUrls(serverReadyProject);

  const tasks = collectUploadTasks(serverReadyProject);
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
  settings: ExportSettings, 
  onProgress?: (percent: number, msg: string) => void,
  signal?: AbortSignal
): Promise<string> => {
  
  onProgress?.(0, '正在分析资源...');
  
  const serverReadyProject = await prepareProjectForExport(project, onProgress, signal);
  
  checkAbort(signal);
  onProgress?.(0.95, '正在提交渲染任务...');

  const payload = {
    project: serverReadyProject,
    exportSettings: settings
  };
  
  const { jobId } = await api.startExportJob(payload as any, signal);

  return jobId;
};