import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useTimelineStore } from '@/stores/useTimelineStore';
import { useUIStore, useSelectedAttachment } from '@/stores/useUIStore';
import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';
import { findGlobalTimeFromMainTime } from '@/utils/timelineUtils';



export function VoiceoverIdentifierTrack() {
  const { subtitles } = useSubtitleStore();
  const segments = useVideoSequenceStore((state) => state.segments);
  const { pixelsPerSecond, scrollPosition } = useTimelineStore();
  const { setSelectedAttachment } = useUIStore();
  const selectedAttachment = useSelectedAttachment();

  const audioSubtitles = subtitles.filter(s => s.audioTrack);

  const handleIdentifierClick = (subtitleId: string) => {
    setSelectedAttachment({ type: 'audio', subtitleId });
  };

  return (
    <div className="h-full bg-bg-primary relative overflow-hidden">
      <div 
        className="relative h-full w-full flex items-center"
        style={{ transform: `translateX(-${scrollPosition}px)` }}
      >
        {audioSubtitles.map((subtitle) => {
          
          const mainStartTimeSec = subtitle.startTime / 1000;
          const mainEndTimeSec = subtitle.endTime / 1000;

          const globalStartTimeSec = findGlobalTimeFromMainTime(mainStartTimeSec, segments);
          const globalEndTimeSec = findGlobalTimeFromMainTime(mainEndTimeSec, segments);
          const globalDurationSec = globalEndTimeSec - globalStartTimeSec;

          const startPos = globalStartTimeSec * pixelsPerSecond;
          const width = Math.max(globalDurationSec * pixelsPerSecond, 40);
          
          const isSelected = selectedAttachment?.type === 'audio' && 
                             selectedAttachment?.subtitleId === subtitle.id;
          
          return (
            <div
              key={subtitle.id}
              className={`
                absolute h-6 rounded-sm cursor-pointer transition-all duration-150
                flex items-center px-2 text-xs text-white
                ${isSelected 
                  ? 'bg-accent-purple border-2 border-white' 
                  : 'bg-teal-800 hover:bg-teal-700'
                }
              `}
              style={{ 
                left: startPos, 
                width
              }}
              onClick={() => handleIdentifierClick(subtitle.id)}
            >
              <div className="truncate text-xs">
                🎵 {subtitle.audioTrack?.track.name || 'Audio'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}