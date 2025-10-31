import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useTimelineStore } from '@/stores/useTimelineStore';
import { useUIStore, useSelectedAttachment } from '@/stores/useUIStore';

export function SoundEffectIdentifierTrack() {
  const { subtitles } = useSubtitleStore();
  const { pixelsPerSecond, scrollPosition } = useTimelineStore();
  const { setSelectedAttachment } = useUIStore();
  const selectedAttachment = useSelectedAttachment();

  const sfxSubtitles = subtitles.filter(s => s.soundEffect);

  const handleIdentifierClick = (subtitleId: string) => {
    setSelectedAttachment({ type: 'soundEffect', subtitleId });
  };

  return (
    <div className="h-full bg-bg-primary relative overflow-hidden">
      <div 
        className="relative h-full w-full flex items-center"
        style={{ transform: `translateX(-${scrollPosition}px)` }}
      >
        {sfxSubtitles.map((subtitle) => {
          if (!subtitle.soundEffect) return null;

          const startPos = (subtitle.startTime / 1000) * pixelsPerSecond;

          // 关键区别：宽度基于音效时长，而不是字幕 endTime
          const width = Math.max(
            (subtitle.soundEffect.track.duration * pixelsPerSecond), 
            40
          );

          const isSelected = selectedAttachment?.type === 'soundEffect' && 
                             selectedAttachment?.subtitleId === subtitle.id;

          return (
            <div
              key={subtitle.id}
              className={`
                absolute h-6 rounded-sm cursor-pointer transition-all duration-150
                flex items-center px-2 text-xs text-white
                ${isSelected 
                  ? 'bg-purple-600 border-2 border-white' 
                  : 'bg-green-800 hover:bg-green-700'
                }
              `}
              style={{ 
                left: startPos, 
                width
              }}
              onClick={() => handleIdentifierClick(subtitle.id)}
            >
              <div className="truncate text-xs">
                🔊 {subtitle.soundEffect.track.name || 'Sound Effect'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}