import type { TimelineSegment } from '@/types/videoSequence';
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

export function findGlobalTimeFromMainTime(mainTimeSec: number, segments: TimelineSegment[]): number {
  const mainTimeMs = mainTimeSec * 1000;

  if (!segments) {
    return mainTimeSec;
  }

  const mainSegments = segments
    .filter(s => s.type === 'main')
    .sort((a, b) => a.sourceStartTime - b.sourceStartTime);

  if (mainSegments.length === 0) {
    return mainTimeSec;
  }

  let anchorSegment: TimelineSegment | null = null;
  for (const segment of mainSegments) {
    if (segment.sourceStartTime <= mainTimeMs) {
      anchorSegment = segment;
    } else {
      break;
    }
  }

  if (anchorSegment === null) {
    return mainSegments[0].globalStartTime / 1000;
  }

  const anchorMainEndTime = anchorSegment.sourceStartTime + anchorSegment.duration;
  const anchorGlobalEndTime = (anchorSegment.globalStartTime + anchorSegment.duration) / 1000;

  if (mainTimeMs < anchorMainEndTime) {
    const offsetInSegment = mainTimeMs - anchorSegment.sourceStartTime;
    return (anchorSegment.globalStartTime + offsetInSegment) / 1000;
  } else {
    return anchorGlobalEndTime;
  }
}

export function findMainTimeFromGlobalTime(globalTimeSec: number, segments: TimelineSegment[]): number {
  const globalTimeMs = globalTimeSec * 1000;

  if (!segments) {
    return globalTimeSec;
  }

  const sortedSegments = segments.sort((a, b) => a.globalStartTime - b.globalStartTime);

  if (sortedSegments.length === 0) {
    return globalTimeSec;
  }

  let lastKnownMainTime = 0;
  let lastKnownMainTimeEnd = 0;

  for (const segment of sortedSegments) {
    const segmentGlobalStartTime = segment.globalStartTime;
    const segmentGlobalEndTime = segment.globalStartTime + segment.duration;

    if (segment.type === 'main') {
      if (globalTimeMs >= segmentGlobalStartTime && globalTimeMs < segmentGlobalEndTime) {
    
        const offsetInSegment = globalTimeMs - segmentGlobalStartTime;
        return (segment.sourceStartTime + offsetInSegment) / 1000;
      }
      lastKnownMainTime = segment.sourceStartTime;
      lastKnownMainTimeEnd = segment.sourceStartTime + segment.duration;
    } else {
    
      if (globalTimeMs >= segmentGlobalStartTime && globalTimeMs < segmentGlobalEndTime) {
        
        return lastKnownMainTimeEnd / 1000;
      }
    }
  }

  
  if (globalTimeMs >= sortedSegments[sortedSegments.length - 1].globalStartTime + sortedSegments[sortedSegments.length - 1].duration) {
     return lastKnownMainTimeEnd / 1000;
  }

  return lastKnownMainTime / 1000;
}