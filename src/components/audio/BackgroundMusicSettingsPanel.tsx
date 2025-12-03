import React from 'react';
import { useAudioStore } from '@/stores/useAudioStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { Volume2, Music, Mic, Video, Trash2 } from 'lucide-react';

const BackgroundMusicSettingsPanel: React.FC = () => {
  const backgroundMusic = useAudioStore((state) => state.backgroundMusic);
  const adjustBackgroundVolume = useAudioStore((state) => state.adjustBackgroundVolume);
  const removeBackgroundMusic = useAudioStore((state) => state.removeBackgroundMusic);
  
  const audioMix = useProjectStore((state) => state.audioMix);
  const setAudioMix = useProjectStore((state) => state.setAudioMix);
  const sourceResources = useProjectStore((state) => state.sourceResources);
  
  const hasSeparatedTracks = !!(sourceResources?.audioVocals && sourceResources?.audioBacking);

  if (!backgroundMusic) {
    return (
      <div className="p-4 text-center text-text-secondary">
        未添加背景音乐
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border-secondary">
        <div className="flex items-center gap-2">
          <Music size={18} className="text-accent-pink" />
          <h3 className="font-medium text-text-primary">背景音乐设置</h3>
        </div>
        <button 
          onClick={removeBackgroundMusic}
          className="p-1.5 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
          title="删除背景音乐"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm text-text-secondary flex items-center gap-2">
            <Volume2 size={14} />
            BGM 音量
          </label>
          <span className="text-xs text-text-tertiary font-mono">
            {Math.round(backgroundMusic.volume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={backgroundMusic.volume * 100}
          
          onChange={(e) => adjustBackgroundVolume(Number(e.target.value) / 100)}
          className="w-full h-1.5 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-pink hover:accent-accent-pink-hover transition-all"
        />
      </div>

      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          全局原声混合
        </h4>

        {hasSeparatedTracks ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary flex items-center gap-1">
                  <Mic size={12} /> 原声人声
                </span>
                <span className="text-text-tertiary">{Math.round(audioMix.originalVocalVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={audioMix.originalVocalVolume * 100}
                onChange={(e) => setAudioMix({ originalVocalVolume: Number(e.target.value) / 100 })}
                className="w-full h-1 bg-bg-tertiary rounded appearance-none cursor-pointer accent-green-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary flex items-center gap-1">
                  <Music size={12} /> 原声背景
                </span>
                <span className="text-text-tertiary">{Math.round(audioMix.backingVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={audioMix.backingVolume * 100}
                onChange={(e) => setAudioMix({ backingVolume: Number(e.target.value) / 100 })}
                className="w-full h-1 bg-bg-tertiary rounded appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-text-secondary">原视频音量</span>
              <span className="text-text-tertiary">{Math.round((audioMix.mainVideoVolume ?? 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={(audioMix.mainVideoVolume ?? 1) * 100}
              onChange={(e) => setAudioMix({ mainVideoVolume: Number(e.target.value) / 100 })}
              className="w-full h-1 bg-bg-tertiary rounded appearance-none cursor-pointer accent-gray-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundMusicSettingsPanel;