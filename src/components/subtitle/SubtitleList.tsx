import React from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useUIStore } from '@/stores/useUIStore';
import { formatMillisecondsToTime } from '@/utils/timelineUtils';

export function SubtitleList() {
  const { currentTime, setCurrentTime } = useProjectStore();
  const { subtitles } = useSubtitleStore();
  const { 
    selectedSubtitleIds, 
    editingSubtitleId,
    setEditingSubtitle,
    setSelectedSubtitles,
    toggleSubtitleSelection 
  } = useUIStore();

  const currentTimeMs = currentTime * 1000;

  const handleSubtitleClick = (subtitleId: string, startTime: number, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      toggleSubtitleSelection(subtitleId);
    } else {
      setSelectedSubtitles([subtitleId]);
      setCurrentTime(startTime / 1000);
    }
  };

  const handleSubtitleDoubleClick = (subtitleId: string) => {
    setEditingSubtitle(subtitleId);
  };

  if (!subtitles.length) {
    return (
      <div className="h-full flex items-center justify-center text-text-tertiary">
        <div className="text-center">
          <div className="text-2xl mb-2">📝</div>
          <div className="text-sm">暂无字幕</div>
          <div className="text-xs mt-1 text-text-disabled">上传视频后将自动识别字幕</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bg-secondary">
      <div className="p-4 border-b border-border-secondary flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-text-primary font-medium text-sm">字幕列表</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">{subtitles.length} 条</span>
            {selectedSubtitleIds.length > 0 && (
              <span className="text-xs text-accent-purple bg-accent-purple/10 px-2 py-1 rounded">
                已选 {selectedSubtitleIds.length}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-px">
          {subtitles.map((subtitle, index) => {
            const isSelected = selectedSubtitleIds.includes(subtitle.id);
            const isEditing = editingSubtitleId === subtitle.id;
            const isCurrent = currentTimeMs >= subtitle.startTime && currentTimeMs < subtitle.endTime;
            const hasAnimation = subtitle.richText ? subtitle.richText.some(segment => segment.animation) : false;

            return (
            <div
              key={subtitle.id}
              className={`
                relative px-4 py-3 cursor-pointer transition-all duration-150
                hover:bg-bg-tertiary/30 border-l-2 border-transparent
                ${isCurrent ? 'bg-accent-blue/10 shadow-inset-accent-blue' : ''}
                ${isEditing ? 'ring-1 ring-accent-purple/40' : ''}
              `}
              onClick={(e) => handleSubtitleClick(subtitle.id, subtitle.startTime, e)}
              onDoubleClick={() => handleSubtitleDoubleClick(subtitle.id)}
            >
                <div className="absolute left-1 top-1/2 transform -translate-y-1/2">
                  <div className={`
                    w-1 h-8 rounded-full transition-colors
                    ${isCurrent ? 'bg-accent-blue' : isSelected ? 'bg-accent-purple' : 'bg-transparent'}
                  `} />
                </div>

            <div className="flex gap-3">
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="text-xs text-text-tertiary font-mono leading-tight">
                      {formatMillisecondsToTime(subtitle.startTime)}
                    </div>
                    <span className="text-xs text-text-disabled font-mono">
                      -&gt;
                    </span>
                    <div className="text-xs text-text-disabled font-mono">
                      {formatMillisecondsToTime(subtitle.endTime)}
                    </div>
                  </div>

                  <div className="min-w-0 mt-1.5">
                    <div className={`
                      text-sm leading-relaxed break-words
                      ${isCurrent ? 'text-text-primary font-medium' : 'text-text-secondary'}
                    `}>
                      {subtitle.text}
                    </div>

                    <div className="flex items-center justify-end mt-1">
                      {hasAnimation && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-yellow-400" title="已应用动效">✨</span>
                          <span className="text-xs text-text-tertiary">
                            {subtitle.richText?.filter(seg => seg.animation).length || 0} 个动效
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1">
                  {isCurrent && (
                    <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
                  )}
                  {isSelected && !isCurrent && (
                    <div className="w-2 h-2 rounded-full bg-accent-purple" />
                  )}
                  {isEditing && (
                    <div className="text-xs text-accent-purple">✎</div>
                  )}
                  {hasAnimation && (
                    <div 
                      className="text-sm text-yellow-400" 
                      title={`${subtitle.richText?.filter(seg => seg.animation).length || 0} 个动效片段`}
                    >
                      ✨
                    </div>
                  )}
                </div>
              </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}