import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTimelineStore } from '@/stores/useTimelineStore';
import { useUIStore } from '@/stores/useUIStore';

export function SubtitleTrack() {
  const { subtitles } = useSubtitleStore();
  const { currentTime } = useProjectStore();
  const { pixelsPerSecond, scrollPosition } = useTimelineStore();
  const { selectedSubtitleIds, setSelectedSubtitles, setEditingSubtitle } = useUIStore();

  const handleSubtitleClick = (subtitleId: string) => {
    setSelectedSubtitles([subtitleId]);
  };

  const handleSubtitleDoubleClick = (subtitleId: string) => {
    setEditingSubtitle(subtitleId);
  };

  return (
    <div className="h-full bg-bg-primary relative overflow-hidden">
      <div 
        className="relative h-full w-full flex items-center"
        style={{ transform: `translateX(-${scrollPosition}px)` }}
      >
        {subtitles.map((subtitle) => {
          const startPos = (subtitle.startTime / 1000) * pixelsPerSecond;
          const width = Math.max(((subtitle.endTime - subtitle.startTime) / 1000) * pixelsPerSecond, 40);
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
                  ? 'bg-accent-purple border border-white/20' 
                  : isCurrent
                    ? 'bg-accent-blue'
                    : 'bg-accent-purple/80 hover:bg-accent-purple'
                }
              `}
              style={{ 
                left: startPos, 
                width
              }}
              onClick={() => handleSubtitleClick(subtitle.id)}
              onDoubleClick={() => handleSubtitleDoubleClick(subtitle.id)}
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