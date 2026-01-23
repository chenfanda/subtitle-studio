import React, { useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { Volume2, Music, Mic, Info } from 'lucide-react';
import type { SourceMixConfig } from '@/types/subtitle';

interface SoundEffectSettingsPanelProps {
  subtitleId: string;
}

const SoundEffectSettingsPanel: React.FC<SoundEffectSettingsPanelProps> = ({ subtitleId }) => {
  const { t } = useTranslation();
  const subtitle = useSubtitleStore((state) => state.subtitles.find((s) => s.id === subtitleId));
  const updateSubtitle = useSubtitleStore((state) => state.updateSubtitle);

  const sourceResources = useProjectStore((state) => state.sourceResources);
  const hasSeparatedTracks = !!(sourceResources?.audioVocals && sourceResources?.audioBacking);

  const sourceMix: SourceMixConfig = subtitle?.sourceMix || {
    originalVocalVolume: 1,
    backingVolume: 1,
  };

  const handleVolumeChange = useCallback((value: number[]) => {
    if (!subtitle?.soundEffect) return;
    const newVolume = value[0];
    updateSubtitle(subtitleId, {
      soundEffect: {
        ...subtitle.soundEffect,
        volume: newVolume / 100,
      },
    });
  }, [subtitle, subtitleId, updateSubtitle]);

  const handleSourceMixChange = useCallback((key: keyof SourceMixConfig, value: number[]) => {
    const newValue = value[0] / 100;
    updateSubtitle(subtitleId, {
      sourceMix: {
        ...sourceMix,
        [key]: newValue,
      },
    });
  }, [subtitleId, sourceMix, updateSubtitle]);

  if (!subtitle?.soundEffect) {
    return (
      <div className="p-4 text-center text-text-secondary">
        {t('请先添加音效')}
      </div>
    );
  }

  const sfxVolume = subtitle.soundEffect.volume ?? 0.7;

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-border-secondary">
        <Music size={18} className="text-accent-blue" />
        <h3 className="font-medium text-text-primary">{t('音效设置')}</h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm text-text-secondary flex items-center gap-2">
            <Volume2 size={14} />
            {t('音效音量')}
          </label>
          <span className="text-xs text-text-tertiary font-mono">
            {Math.round(sfxVolume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="200"
          value={sfxVolume * 100}
          onChange={(e) => handleVolumeChange([Number(e.target.value)])}
          className="w-full h-1.5 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-blue hover:accent-accent-blue-hover transition-all"
        />
      </div>

      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          {t('原声混合 (当前片段)')}
        </h4>

        {hasSeparatedTracks ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary flex items-center gap-1">
                  <Mic size={12} /> {t('原声人声')}
                </span>
                <span className="text-text-tertiary">{Math.round((sourceMix.originalVocalVolume ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={(sourceMix.originalVocalVolume ?? 1) * 100}
                onChange={(e) => handleSourceMixChange('originalVocalVolume', [Number(e.target.value)])}
                className="w-full h-1 bg-bg-tertiary rounded appearance-none cursor-pointer accent-green-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary flex items-center gap-1">
                  <Music size={12} /> {t('原声背景')}
                </span>
                <span className="text-text-tertiary">{Math.round((sourceMix.backingVolume ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={(sourceMix.backingVolume ?? 1) * 100}
                onChange={(e) => handleSourceMixChange('backingVolume', [Number(e.target.value)])}
                className="w-full h-1 bg-bg-tertiary rounded appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </>
        ) : (
          <div className="p-3 bg-bg-secondary rounded-md text-xs text-text-tertiary flex items-start gap-2">
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              {t('未检测到分离音轨，无法独立调节原声的人声和背景音。原声将以默认音量播放。')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoundEffectSettingsPanel;