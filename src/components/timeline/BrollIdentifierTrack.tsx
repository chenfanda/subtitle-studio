import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useTimelineStore } from '@/stores/useTimelineStore';
import { useUIStore, useSelectedAttachment } from '@/stores/useUIStore';
import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';
import { findGlobalTimeFromMainTime } from '@/utils/timelineUtils';
import { Film } from 'lucide-react';

export function BrollIdentifierTrack() {
  const { subtitles } = useSubtitleStore();
  const segments = useVideoSequenceStore((state) => state.segments);
  const { pixelsPerSecond, scrollPosition } = useTimelineStore();
  const { setSelectedAttachment } = useUIStore();
  const selectedAttachment = useSelectedAttachment();

  const brollSubtitles = subtitles.filter(s => s.brollVideo);

  const handleIdentifierClick = (subtitleId: string) => {
    setSelectedAttachment({ type: 'broll', subtitleId });
  };

  return (
    <div className="h-full bg-bg-primary relative overflow-hidden">
      <div 
        className="relative h-full w-full flex items-center"
        style={{ transform: `translateX(-${scrollPosition}px)` }}
      >
        {brollSubtitles.map((subtitle) => {
          
          const mainStartTimeSec = subtitle.startTime / 1000;
          const mainEndTimeSec = subtitle.endTime / 1000;

          const globalStartTimeSec = findGlobalTimeFromMainTime(mainStartTimeSec, segments);
          
          const startPos = globalStartTimeSec * pixelsPerSecond;
          
          const durationSec = mainEndTimeSec - mainStartTimeSec;
          const width = Math.max(durationSec * pixelsPerSecond, 40);
          
          const isSelected = selectedAttachment?.type === 'broll' && 
                             selectedAttachment?.subtitleId === subtitle.id;
          
          return (
            <div
              key={subtitle.id}
              className={`
                absolute h-6 rounded-sm cursor-pointer transition-all duration-150
                flex items-center px-2 text-xs text-white
                ${isSelected 
                  ? 'bg-accent-purple border-2 border-white' 
                  : 'bg-green-800 hover:bg-green-700'
                }
              `}
              style={{ 
                left: startPos, 
                width
              }}
              onClick={() => handleIdentifierClick(subtitle.id)}
            >
              <Film className="w-3 h-3 mr-1" />
              <div className="truncate text-xs">
                {subtitle.brollVideo?.video.name || 'B-roll'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}