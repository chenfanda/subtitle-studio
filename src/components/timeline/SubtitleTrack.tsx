import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTimelineStore } from '@/stores/useTimelineStore';
import { useUIStore } from '@/stores/useUIStore';

export function SubtitleTrack() {
  const { subtitles } = useSubtitleStore();
  const { currentTime, setCurrentTime } = useProjectStore(); 
  const { pixelsPerSecond, scrollPosition } = useTimelineStore();
  const { selectedSubtitleIds, setSelectedSubtitles, setEditingSubtitle } = useUIStore();

  const handleSubtitleClick = (subtitleId: string, startTime: number) => {
    setSelectedSubtitles([subtitleId]);
    setCurrentTime(startTime / 1000); 
  };

  const handleSubtitleDoubleClick = (subtitleId: string, startTime: number) => {
    setEditingSubtitle(subtitleId);
    setCurrentTime(startTime / 1000); 
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
                
                {/* 📍 这里的逻辑已按您的要求修改 */}
                ${isSelected 
                  ? 'bg-accent-purple border-2 border-white' // 1. 选中: 紫色 + 2px 白色边框
                  : isCurrent
                    ? 'bg-accent-blue'                       // 2. 未选中 (播放头在上面): 亮蓝色
                    : 'bg-accent-blue/80 hover:bg-accent-blue' // 3. 未选中 (默认): 淡蓝色
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