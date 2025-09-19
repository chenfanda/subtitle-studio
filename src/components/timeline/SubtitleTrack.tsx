// src/components/timeline/SubtitleTrack.tsx
import { useProjectStore } from '@/stores/useProjectStore';
import { useTimelineStore } from '@/stores/useTimelineStore';
import { useUIStore } from '@/stores/useUIStore';

export function SubtitleTrack() {
  const { subtitles, currentTime } = useProjectStore();
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
      {/* 字幕块区域 - 全宽显示 */}
      <div 
        className="relative h-full w-full flex items-center"
        style={{ transform: `translateX(-${scrollPosition}px)` }}
      >
        {subtitles.map((subtitle) => {
          // 字幕位置：字幕时间(毫秒) ÷ 1000 × 像素每秒
          const startPos = (subtitle.startTime / 1000) * pixelsPerSecond;
          const width = Math.max(((subtitle.endTime - subtitle.startTime) / 1000) * pixelsPerSecond, 40);
          const isSelected = selectedSubtitleIds.includes(subtitle.id);
          
          // 时间比较：currentTime(秒) × 1000 与字幕时间(毫秒)比较
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