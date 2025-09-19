// 视频播放相关的工具函数

/**
 * 时间格式化工具
 */
export const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 将时间字符串转换为秒数
 */
export const parseTimeToSeconds = (timeString: string): number => {
  const parts = timeString.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
};

/**
 * 计算视频播放进度百分比
 */
export const calculateProgress = (currentTime: number, duration: number): number => {
  if (duration === 0) return 0;
  return Math.min(100, Math.max(0, (currentTime / duration) * 100));
};

/**
 * 根据进度百分比计算时间
 */
export const calculateTimeFromProgress = (progress: number, duration: number): number => {
  return Math.max(0, Math.min(duration, (progress / 100) * duration));
};

/**
 * 调整音量范围
 */
export const clampVolume = (volume: number): number => {
  return Math.max(0, Math.min(100, volume));
};

/**
 * 调整播放速率范围
 */
export const clampPlaybackRate = (rate: number): number => {
  return Math.max(0.25, Math.min(4, rate));
};

/**
 * 获取支持的播放速率选项
 */
export const getPlaybackRateOptions = (): Array<{ value: number; label: string }> => {
  return [
    { value: 0.25, label: '0.25x' },
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1, label: '1x' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' },
    { value: 2, label: '2x' },
  ];
};

/**
 * 检查视频是否可播放
 */
export const canPlayVideo = (videoElement: HTMLVideoElement): boolean => {
  return videoElement.readyState >= videoElement.HAVE_CURRENT_DATA;
};

/**
 * 获取视频元数据
 */
export const getVideoMetadata = (videoElement: HTMLVideoElement) => {
  return {
    duration: videoElement.duration || 0,
    videoWidth: videoElement.videoWidth || 0,
    videoHeight: videoElement.videoHeight || 0,
    readyState: videoElement.readyState,
  };
};

/**
 * 计算视频显示尺寸（保持比例）
 */
export const calculateVideoDisplaySize = (
  videoWidth: number,
  videoHeight: number,
  containerWidth: number,
  containerHeight: number
): { width: number; height: number } => {
  if (videoWidth === 0 || videoHeight === 0) {
    return { width: containerWidth, height: containerHeight };
  }
  
  const videoAspectRatio = videoWidth / videoHeight;
  const containerAspectRatio = containerWidth / containerHeight;
  
  if (videoAspectRatio > containerAspectRatio) {
    // 视频更宽，以宽度为准
    return {
      width: containerWidth,
      height: containerWidth / videoAspectRatio,
    };
  } else {
    // 视频更高，以高度为准
    return {
      width: containerHeight * videoAspectRatio,
      height: containerHeight,
    };
  }
};

/**
 * 跳转到指定时间
 */
export const seekToTime = (videoElement: HTMLVideoElement, time: number): void => {
  if (canPlayVideo(videoElement)) {
    videoElement.currentTime = Math.max(0, Math.min(time, videoElement.duration));
  }
};

/**
 * 快进/快退
 */
export const skipTime = (videoElement: HTMLVideoElement, deltaSeconds: number): void => {
  const newTime = videoElement.currentTime + deltaSeconds;
  seekToTime(videoElement, newTime);
};