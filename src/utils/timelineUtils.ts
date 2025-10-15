// src/utils/timelineUtils.ts
export interface TimeMarkData {
  time: number;
  position: number;
  isMainMark: boolean;
  label: string;
}

export function formatTimeCode(timeInSeconds: number): string {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 格式化毫秒为显示用时间码（用于 UI 展示）
 * @param ms 毫秒数
 * @returns HH:MM:SS 或 MM:SS 格式
 */
export function formatMillisecondsToTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 格式化毫秒为 FFmpeg 时间格式（用于视频导出）
 * @param ms 毫秒数
 * @returns HH:MM:SS.mmm 格式
 */
export function formatMillisecondsToFFmpeg(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

export function generateTimeMarks(duration: number, pixelsPerSecond: number, containerWidth: number): TimeMarkData[] {
  const visibleDuration = containerWidth / pixelsPerSecond;
  const markInterval = calculateOptimalInterval(visibleDuration);
  const marks: TimeMarkData[] = [];
  
  for (let time = 0; time <= duration; time += markInterval) {
    const position = time * pixelsPerSecond;
    if (position <= containerWidth) {
      marks.push({
        time,
        position,
        isMainMark: time % (markInterval * 5) === 0,
        label: formatTimeCode(time)
      });
    }
  }
  
  return marks;
}

function calculateOptimalInterval(visibleDuration: number): number {
  if (visibleDuration <= 30) return 1;
  if (visibleDuration <= 120) return 5;
  if (visibleDuration <= 600) return 10;
  if (visibleDuration <= 1800) return 30;
  return 60;
}