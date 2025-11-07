import { useState } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useUIStore, useSelectedSubtitles } from '@/stores/useUIStore';
import { formatMillisecondsToTime } from '@/utils/timelineUtils';
import { useVoiceoverStore } from '@/stores/useVoiceoverStore';
import { FileText, Mic, Volume2 } from 'lucide-react';

export function VoiceoverTaskPanel() {
  const { setCurrentTime } = useProjectStore();
  const { subtitles, removeSubtitleAudio } = useSubtitleStore();
  const selectedSubtitleIds = useSelectedSubtitles();
  const { setSelectedSubtitles, openDialog } = useUIStore();
  const resetVoiceoverDialog = useVoiceoverStore(state => state.resetDialog);

  const handleAudioClick = (subtitleId: string) => {
    const subtitle = subtitles.find(s => s.id === subtitleId);
    if (!subtitle) return;

    setSelectedSubtitles([subtitleId]);
    setCurrentTime(subtitle.startTime / 1000);

    if (subtitle.audioTrack) {
      removeSubtitleAudio(subtitleId);
    } else {
      openDialog('voiceover', subtitleId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      <div className="p-4 border-b border-border-secondary">
        <h3 className="text-lg font-semibold text-text-primary mb-1">字幕配音</h3>
        <p className="text-xs text-text-secondary">
          为字幕列表生成或添加配音
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {subtitles.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-tertiary">
            <div className="text-center">
              <FileText size={48} className="mb-2 mx-auto" />
              <div className="text-sm">暂无字幕</div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {subtitles.map((subtitle) => {
              const hasAudio = !!subtitle.audioTrack;
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
                    onClick={() => handleAudioClick(subtitle.id)}
                    className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                      hasAudio
                        ? 'border-orange-500 shadow-lg shadow-orange-500/20 hover:border-red-500'
                        : 'border-border-secondary hover:border-accent-purple'
                    }`}
                    title={hasAudio ? '点击删除配音' : '点击添加配音'}
                  >
                    {hasAudio && subtitle.audioTrack ? (
                      <div className="relative w-full h-full group">
                        <div className="w-full h-full bg-bg-tertiary flex items-center justify-center text-orange-500">
                          <Volume2 size={24} />
                        </div>
                        <div className="absolute top-1 left-1 w-2 h-2 bg-orange-500 rounded-full" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                            删除
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
                    <div className="text-xs text-text-secondary">
                      {formatMillisecondsToTime(subtitle.startTime)} - {formatMillisecondsToTime(subtitle.endTime)}
                    </div>
                    {hasAudio && (
                      <div className="text-xs text-orange-500 mt-1">
                        ✓ 已添加配音
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