import { useAudioStore, useBackgroundMusic } from '@/stores/useAudioStore';
import { useTimelineStore } from '@/stores/useTimelineStore';
import { useUIStore, useSelectedAttachment } from '@/stores/useUIStore';

export function BackgroundMusicTrack() {
  const backgroundMusic = useBackgroundMusic();

  const { pixelsPerSecond, scrollPosition } = useTimelineStore();
  const { setSelectedAttachment } = useUIStore();
  const selectedAttachment = useSelectedAttachment();

  if (!backgroundMusic) {
    return (
      <div className="h-full bg-bg-primary relative overflow-hidden flex items-center justify-center text-xs text-text-tertiary px-4">
      </div>
    );
  }

  const handleTrackClick = () => {
    setSelectedAttachment({ type: 'backgroundMusic' });
  };

  const startPos = 0;
  const trackWidth = Math.max(
  (backgroundMusic.duration * pixelsPerSecond),
  40 
  );

  const isSelected = selectedAttachment?.type === 'backgroundMusic';

  return (
    <div className="h-full bg-bg-primary relative overflow-hidden p-1">
      <div 
        className="relative h-full w-full"
        style={{ transform: `translateX(-${scrollPosition}px)` }}
      >
        <div
          className={`
            absolute h-full rounded-sm cursor-pointer transition-all duration-150
            flex items-center px-2 text-xs text-white
            ${isSelected 
              // 📍 修复: 将 bg-blue-800 替换为 bg-accent-purple
              ? 'bg-accent-purple border-2 border-white' 
              : 'bg-indigo-900 hover:bg-indigo-800'
            }
          `}
          style={{ 
            left: startPos, 
            width: trackWidth
          }}
          onClick={handleTrackClick}
        >
          <div className="truncate text-xs">
            🎵 {backgroundMusic.name || 'Background Music'}
          </div>
        </div>
      </div>
    </div>
  );
}