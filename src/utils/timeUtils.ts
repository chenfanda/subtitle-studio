// src/utils/timelineUtils.ts
export function formatTimeCode(timeInSeconds: number): string {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

export interface TimeMarkData {
  time: number;
  position: number;
  isMainMark: boolean;
  label: string;
}