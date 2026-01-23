import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { Trash2, Clock, Link2, ListVideo, Film } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60);

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(3).padStart(6, '0')}`;
}

export function VideoSequenceList() {
  const { t } = useTranslation();
  const { segments, removeSegment } = useVideoSequenceStore();
  const { setCurrentTime } = useProjectStore();

  const handleItemClick = (globalStartTimeMs: number) => {
    setCurrentTime(globalStartTimeMs / 1000);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeSegment(id);
  };

  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-text-secondary">
        <ListVideo size={32} className="mb-2" />
        <p className="text-sm">{t('尚未添加视频片段')}</p>
        <p className="text-xs mt-1">
          {t('请在主视频加载后开始操作')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-2 gap-2">
      {segments.map((segment, index) => (
        <div
          key={segment.id}
          onClick={() => handleItemClick(segment.globalStartTime)}
          className="
            group p-3 rounded-lg border border-border-secondary 
            bg-bg-primary hover:bg-bg-tertiary 
            cursor-pointer transition-colors
          "
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-text-primary">
              {t('片段')} #{index + 1}
            </span>
            {segment.type === 'insert' && (
              <button
                onClick={(e) => handleDeleteClick(e, segment.id)}
                className="
                  p-1 rounded text-text-secondary hover:text-accent-red 
                  hover:bg-accent-red/10 transition-colors
                  opacity-0 group-hover:opacity-100
                "
                aria-label="删除片段"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-text-secondary text-xs mb-1">
            {segment.type === 'main' ? (
              <Film size={12} />
            ) : (
              <Link2 size={12} />
            )}
            <span className="truncate" title={segment.sourceUrl}>
              {segment.type === 'main' ? t('主视频片段') : segment.sourceUrl}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-text-secondary text-xs">
            <Clock size={12} />
            <span>
              {t('开始于')} {formatTime(segment.globalStartTime)}
            </span>
            <span className="text-text-tertiary">|</span>
            <span>
              {t('时长')} {formatTime(segment.duration)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}