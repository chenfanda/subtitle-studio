import { useState } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useUIStore, useSelectedSubtitles } from '@/stores/useUIStore';
import { BrollDialog } from './BrollDialog';
import { formatMillisecondsToTime } from '@/utils/timelineUtils';

export function BrollPanel() {
  const [showDialog, setShowDialog] = useState(false);
  const [targetSubtitleId, setTargetSubtitleId] = useState<string>('');
  
  const { setCurrentTime } = useProjectStore();
  const { subtitles, removeSubtitleBroll } = useSubtitleStore();
  const selectedSubtitleIds = useSelectedSubtitles();
  const { setSelectedSubtitles } = useUIStore();

  const handleThumbnailClick = (subtitleId: string) => {
    const subtitle = subtitles.find(s => s.id === subtitleId);
    if (!subtitle) return;

    setSelectedSubtitles([subtitleId]);
    setCurrentTime(subtitle.startTime / 1000);

    if (subtitle.brollVideo) {
      removeSubtitleBroll(subtitleId);
    } else {
      setTargetSubtitleId(subtitleId);
      setShowDialog(true);
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      <div className="p-4 border-b border-border-secondary">
        <h3 className="text-lg font-semibold text-text-primary mb-1">B-roll</h3>
        <p className="text-xs text-text-secondary">
          为字幕片段添加丰富您的内容
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {subtitles.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-tertiary">
            <div className="text-center">
              <div className="text-4xl mb-2">📝</div>
              <div className="text-sm">暂无字幕</div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {subtitles.map((subtitle) => {
              const hasBroll = !!subtitle.brollVideo;
              const isSelected = selectedSubtitleIds.includes(subtitle.id);

              return (
                <div
                  key={subtitle.id}
                  className={`flex gap-3 p-2 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-accent-purple bg-accent-purple/5'
                      : 'border-transparent hover:border-border-primary'
                  }`}
                >
                  <button
                    onClick={() => handleThumbnailClick(subtitle.id)}
                    className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                      hasBroll
                        ? 'border-orange-500 shadow-lg shadow-orange-500/20 hover:border-red-500'
                        : 'border-border-secondary hover:border-accent-purple'
                    }`}
                    title={hasBroll ? '点击删除 B-roll' : '点击添加 B-roll'}
                  >
                    {hasBroll && subtitle.brollVideo ? (
                      <div className="relative w-full h-full group">
                        <img
                          src={subtitle.brollVideo.video.thumbnail}
                          alt="B-roll"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 w-2 h-2 bg-orange-500 rounded-full" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                            删除
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-bg-tertiary flex items-center justify-center text-text-tertiary">
                        <span className="text-2xl">📷</span>
                      </div>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary truncate mb-1">
                      {subtitle.text}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {formatMillisecondsToTime(subtitle.startTime)} - {formatMillisecondsToTime(subtitle.endTime)}
                    </div>
                    {hasBroll && (
                      <div className="text-xs text-orange-500 mt-1">
                        ✓ 已添加 B-roll
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BrollDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        targetSubtitleId={targetSubtitleId}
      />
    </div>
  );
}