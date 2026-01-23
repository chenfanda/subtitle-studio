
import { useState, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useUIStore, useSelectedSubtitles } from '@/stores/useUIStore';
import { formatMillisecondsToTime, findGlobalTimeFromMainTime } from '@/utils/timelineUtils';
import { FileText, Mic, Volume2, Users, List, ArrowRight } from 'lucide-react';
import { BatchVoiceoverPanel } from './voiceover/BatchVoiceoverPanel';
import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';
import { useTranslation } from '@/hooks/useTranslation';

export function VoiceoverTaskPanel() {
  const { t } = useTranslation();
  const { setCurrentTime, setGlobalTime } = useProjectStore();
  const { subtitles, removeSubtitleAudio } = useSubtitleStore();
  const selectedSubtitleIds = useSelectedSubtitles();
  const { setSelectedSubtitles, openDialog } = useUIStore();
  const segments = useVideoSequenceStore((state) => state.segments);

  // 本地状态：是否显示批量面板
  const [showBatchPanel, setShowBatchPanel] = useState(false);

  useEffect(() => {
    if (selectedSubtitleIds.length > 1 && !showBatchPanel) {

    }

    if (selectedSubtitleIds.length === 0 && showBatchPanel) {
      setShowBatchPanel(false);
    }
  }, [selectedSubtitleIds.length]);

  const handleAudioClick = (subtitleId: string) => {
    const subtitle = subtitles.find(s => s.id === subtitleId);
    if (!subtitle) return;

    // 单选逻辑
    setSelectedSubtitles([subtitleId]);
    setCurrentTime(subtitle.startTime / 1000);

    if (subtitle.audioTrack) {
      removeSubtitleAudio(subtitleId);
    } else {
      // 打开单条配音弹窗 (这里会加载 VoiceoverSourceView)
      openDialog('voiceover', subtitleId);
    }
  };

  const toggleBatchMode = () => {
    if (showBatchPanel) {
      setShowBatchPanel(false);
    } else {
      setShowBatchPanel(true);
    }
  };

  // 如果处于批量模式，直接渲染批量面板
  if (showBatchPanel) {
    return (
      <div className="h-full flex flex-col bg-bg-primary">
        <div className="p-4 border-b border-border-secondary flex items-center justify-between">
          <button
            onClick={() => setShowBatchPanel(false)}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <List size={16} />
            {t('返回列表')}
          </button>
          <span className="text-sm font-semibold text-accent-purple">{t('批量配音模式')}</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <BatchVoiceoverPanel />
        </div>
      </div>
    );
  }

  // 默认列表模式
  return (
    <div className="h-full flex flex-col bg-bg-primary">
      <div className="p-4 border-b border-border-secondary flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">{t('字幕配音')}</h3>
          <p className="text-xs text-text-secondary">
            {t('管理字幕与 AI 配音')}
          </p>
        </div>

        {/* 批量模式入口按钮 */}
        <button
          onClick={toggleBatchMode}
          disabled={selectedSubtitleIds.length === 0}
          className={`
            p-2 rounded-lg transition-all flex flex-col items-center gap-1
            ${selectedSubtitleIds.length > 0
              ? 'bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20'
              : 'bg-bg-tertiary text-text-tertiary cursor-not-allowed opacity-50'
            }
          `}
          title={selectedSubtitleIds.length === 0 ? t("请先选择字幕") : t("进入批量配音模式")}
        >
          <Users size={20} />
          <span className="text-[10px]">{t('批量')}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {subtitles.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-tertiary">
            <div className="text-center">
              <FileText size={48} className="mb-2 mx-auto" />
              <div className="text-sm">{t('暂无字幕')}</div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* 提示条：如果选中了多条但没进批量模式 */}
            {selectedSubtitleIds.length > 1 && (
              <div
                onClick={() => setShowBatchPanel(true)}
                className="bg-accent-purple/10 border border-accent-purple/20 p-2 rounded text-xs text-accent-purple flex items-center justify-between cursor-pointer hover:bg-accent-purple/20 transition-colors"
              >
                <span>{t('已选中')} {selectedSubtitleIds.length} {t('条')}</span>
                <div className="flex items-center gap-1 font-medium">
                  {t('去批量配音')} <ArrowRight size={12} />
                </div>
              </div>
            )}

            {subtitles.map((subtitle) => {
              const hasAudio = !!subtitle.audioTrack;
              const isSelected = selectedSubtitleIds.includes(subtitle.id);

              return (
                <div
                  key={subtitle.id}
                  onClick={() => {

                    if (isSelected && selectedSubtitleIds.length === 1) {

                    } else {
                      setSelectedSubtitles([subtitle.id]);
                    }
                    const startTimeSec = subtitle.startTime / 1000;
                    const mainTimeSec = startTimeSec + 0.001;
                    const globalTimeSec = findGlobalTimeFromMainTime(mainTimeSec, segments);
                    setGlobalTime(globalTimeSec);
                    setCurrentTime(mainTimeSec);
                  }}
                  className={`flex gap-3 p-2 rounded-lg border-2 transition-all cursor-pointer ${isSelected
                      ? 'border-accent-purple bg-accent-purple/5'
                      : 'border-transparent hover:border-border-primary'
                    }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 阻止触发选中
                      handleAudioClick(subtitle.id);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${hasAudio
                        ? 'border-orange-500 shadow-lg shadow-orange-500/20 hover:border-red-500'
                        : 'border-border-secondary hover:border-accent-purple'
                      }`}
                    title={hasAudio ? t('点击删除配音') : t('点击添加配音')}
                  >
                    {hasAudio && subtitle.audioTrack ? (
                      <div className="relative w-full h-full group">
                        <div className="w-full h-full bg-bg-tertiary flex items-center justify-center text-orange-500">
                          <Volume2 size={24} />
                        </div>
                        <div className="absolute top-1 left-1 w-2 h-2 bg-orange-500 rounded-full" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                            {t('删除')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-bg-tertiary flex items-center justify-center text-text-tertiary">
                        <Mic size={24} />
                      </div>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary truncate mb-1">
                      {subtitle.text}
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span>{formatMillisecondsToTime(subtitle.startTime)} - {formatMillisecondsToTime(subtitle.endTime)}</span>
                      {subtitle.speaker && (
                        <span className="bg-bg-tertiary px-1.5 rounded text-[10px] border border-border-secondary">
                          {subtitle.speaker}
                        </span>
                      )}
                    </div>
                    {hasAudio && (
                      <div className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                        <Volume2 size={10} />
                        <span>{t('已配音')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}