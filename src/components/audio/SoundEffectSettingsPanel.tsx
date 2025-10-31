import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useEffect, useState, useMemo } from 'react';
import type { SubtitleSoundEffectData } from '@/types/subtitle';
import { useUIStore } from '@/stores/useUIStore';

interface SoundEffectSettingsPanelProps {
  subtitleId: string;
}

export function SoundEffectSettingsPanel({ subtitleId }: SoundEffectSettingsPanelProps) {
  const subtitles = useSubtitleStore(state => state.subtitles);
  const setSubtitleSoundEffect = useSubtitleStore(state => state.setSubtitleSoundEffect);

  const subtitle = useMemo(() => 
    subtitles.find(s => s.id === subtitleId),
  [subtitles, subtitleId]);

  const setSelectedAttachment = useUIStore(state => state.setSelectedAttachment);

  const [volume, setVolume] = useState(subtitle?.soundEffect?.volume || 0.7);

  const handleClose = () => {
    setSelectedAttachment(null);
  };

  useEffect(() => {
    if (subtitle?.soundEffect) {
      setVolume(subtitle.soundEffect.volume);
    }
  }, [subtitle?.soundEffect]);

  useEffect(() => {
    if (!subtitle || !subtitle.soundEffect) {
      handleClose();
    }
  }, [subtitle]);

  const updateStore = (updates: Partial<SubtitleSoundEffectData>) => {
    if (subtitle?.soundEffect) {
      setSubtitleSoundEffect(subtitleId, { ...subtitle.soundEffect, ...updates });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    updateStore({ volume: newVolume });
  };

  if (!subtitle) {
    return null;
  }

  return (
    // 📍 修复 1: 移除内联 style, 替换为 w-72 (288px) 和 bg-bg-primary
    <div className="w-50 bg-bg-primary p-4 flex-shrink-0 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white text-lg font-semibold">音效</h3>
        <button 
          onClick={handleClose} 
          className="text-gray-400 hover:text-white text-2xl"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        <div>
          <label className="block text-sm text-gray-300 mb-2">音量</label>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              // 📍 修复 2: 添加 focus:outline-none 移除边框
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
            />
            <div className="w-16 flex-shrink-0 text-center bg-gray-800 text-white rounded-md px-2 py-1 text-sm">
              {Math.round(volume * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}