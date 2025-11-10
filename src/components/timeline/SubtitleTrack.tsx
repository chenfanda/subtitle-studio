import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTimelineStore } from '@/stores/useTimelineStore';
import { findGlobalTimeFromMainTime } from '@/utils/timelineUtils';
import { useUIStore } from '@/stores/useUIStore';
import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';



export function SubtitleTrack() {
  const { subtitles } = useSubtitleStore();
  const { currentTime, setCurrentTime, setGlobalTime } = useProjectStore(); 
  const segments = useVideoSequenceStore((state) => state.segments);
  const { pixelsPerSecond, scrollPosition } = useTimelineStore();
  const { selectedSubtitleIds, setSelectedSubtitles, setEditingSubtitle } = useUIStore();

  const handleSubtitleClick = (subtitleId: string, startTime: number) => {
    const mainStartTimeSec = startTime / 1000;
    const globalStartTimeSec = findGlobalTimeFromMainTime(mainStartTimeSec, segments);

    setSelectedSubtitles([subtitleId]);
    setCurrentTime(mainStartTimeSec); 
    setGlobalTime(globalStartTimeSec);
  };

  const handleSubtitleDoubleClick = (subtitleId: string, startTime: number) => {
    const mainStartTimeSec = startTime / 1000;
    const globalStartTimeSec = findGlobalTimeFromMainTime(mainStartTimeSec, segments);
    
    setEditingSubtitle(subtitleId);
    setCurrentTime(mainStartTimeSec); 
    setGlobalTime(globalStartTimeSec);
  };

  return (
    <div className="h-full bg-bg-primary relative overflow-hidden">
      <div 
        className="relative h-full w-full flex items-center"
        style={{ transform: `translateX(-${scrollPosition}px)` }}
      >
        {subtitles.map((subtitle) => {
          const mainStartTimeSec = subtitle.startTime / 1000;
          const mainEndTimeSec = subtitle.endTime / 1000;

          const globalStartTimeSec = findGlobalTimeFromMainTime(mainStartTimeSec, segments);
          
          
          const startPos = globalStartTimeSec * pixelsPerSecond;
          const durationSec = mainEndTimeSec - mainStartTimeSec;
          const width = Math.max(durationSec * pixelsPerSecond, 40);
          
          
          const isSelected = selectedSubtitleIds.includes(subtitle.id);
          
          const currentTimeMs = (currentTime || 0) * 1000;
          const isCurrent = currentTimeMs >= subtitle.startTime && currentTimeMs <= subtitle.endTime;
          
          return (
            <div
              key={subtitle.id}
              className={`
                absolute h-6 rounded-sm cursor-pointer transition-all duration-150
                flex items-center px-2 text-xs text-white
                
                ${isSelected 
                  ? 'bg-accent-purple border-2 border-white'
                  : isCurrent
                    ? 'bg-accent-blue'
                    : 'bg-accent-blue/80 hover:bg-accent-blue'
                }
              `}
              style={{ 
                left: startPos, 
                width
              }}
              onClick={() => handleSubtitleClick(subtitle.id, subtitle.startTime)}
              onDoubleClick={() => handleSubtitleDoubleClick(subtitle.id, subtitle.startTime)}
            >
              <div className="truncate text-xs">
                {subtitle.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}