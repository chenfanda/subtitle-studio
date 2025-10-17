import { useMemo } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useTimelineStore } from '@/stores/useTimelineStore';

interface TimeMark {
  time: number;
  position: number;
  isMainMark: boolean;
  label: string;
}

export function TimelineRuler() {
  const { duration } = useProjectStore();
  const { subtitles } = useSubtitleStore();
  const { pixelsPerSecond, scrollPosition } = useTimelineStore();
  
  const formatTime = (timeMs: number, showMilliseconds: boolean = false): string => {
    const totalMs = Math.floor(timeMs);
    const mins = Math.floor(totalMs / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;
    
    const baseTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return showMilliseconds ? `${baseTime}.${ms.toString().padStart(3, '0')}` : baseTime;
  };
  
  const timeMarks = useMemo(() => {
    if (!duration || duration <= 0) return [];
    
    const marks: TimeMark[] = [];
    
    let intervalSeconds: number;
    let showMilliseconds: boolean = false;
    
    if (pixelsPerSecond > 200) {
      intervalSeconds = 0.1;
      showMilliseconds = true;
    } else if (pixelsPerSecond > 100) {
      intervalSeconds = 0.5;
      showMilliseconds = true;
    } else if (pixelsPerSecond > 50) {
      intervalSeconds = 1;
    } else if (pixelsPerSecond > 20) {
      intervalSeconds = 5;
    } else {
      intervalSeconds = 10;
    }
    
    const minorIntervalSeconds = intervalSeconds;
    const majorIntervalSeconds = intervalSeconds * 2;
    
    for (let timeSeconds = 0; timeSeconds <= duration; timeSeconds += minorIntervalSeconds) {
      const position = timeSeconds * pixelsPerSecond;
      const isMajor = (timeSeconds % majorIntervalSeconds) < 0.001;
      
      marks.push({
        time: timeSeconds * 1000,
        position,
        isMainMark: isMajor,
        label: isMajor ? formatTime(timeSeconds * 1000, showMilliseconds) : ''
      });
    }
    
    const keyTimes = new Set<number>();
    subtitles.forEach(subtitle => {
      const startSeconds = subtitle.startTime / 1000;
      const endSeconds = subtitle.endTime / 1000;
      
      if (startSeconds <= duration) keyTimes.add(startSeconds);
      if (endSeconds <= duration) keyTimes.add(endSeconds);
    });
    
    Array.from(keyTimes).forEach(timeSeconds => {
      const position = timeSeconds * pixelsPerSecond;
      const hasExisting = marks.some(mark => 
        Math.abs((mark.time / 1000) - timeSeconds) < minorIntervalSeconds / 2
      );
      
      if (!hasExisting && timeSeconds <= duration) {
        marks.push({
          time: timeSeconds * 1000,
          position,
          isMainMark: false,
          label: ''
        });
      }
    });
    
    return marks.sort((a, b) => a.time - b.time);
  }, [duration, pixelsPerSecond, subtitles]);

  return (
    <div className="h-full bg-bg-tertiary relative overflow-hidden">
      <div 
        className="relative h-full w-full"
        style={{ transform: `translateX(-${scrollPosition}px)` }}
      >
        {timeMarks.map((mark) => (
          <div
            key={mark.time}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: mark.position }}
          >
            <div 
              className={`w-px ${
                mark.isMainMark 
                  ? 'bg-text-secondary h-6' 
                  : 'bg-text-tertiary h-3'
              } mt-1`}
            />
            
            {mark.isMainMark && mark.label && (
              <div 
                className="text-xs text-text-secondary whitespace-nowrap font-mono absolute top-0"
                style={{ 
                  transform: 'translateX(-50%)',
                  marginTop: '-2px'
                }}
              >
                {mark.label}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}