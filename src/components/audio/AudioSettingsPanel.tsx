import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useEffect, useState, useMemo } from 'react';
import type { SubtitleAudioData } from '@/types/subtitle';
import { useUIStore } from '@/stores/useUIStore';

// 这是一个内联的开关组件，以匹配截图样式
function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer 
        rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out
        ${enabled ? 'bg-accent-purple' : 'bg-gray-600'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 
          transform rounded-full bg-white shadow ring-0 
          transition duration-200 ease-in-out
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

interface AudioSettingsPanelProps {
  subtitleId: string;
}

export function AudioSettingsPanel({ subtitleId }: AudioSettingsPanelProps) {
  const subtitles = useSubtitleStore(state => state.subtitles);
  const setSubtitleAudio = useSubtitleStore(state => state.setSubtitleAudio);
  
  const subtitle = useMemo(() => 
    subtitles.find(s => s.id === subtitleId),
  [subtitles, subtitleId]);

  const setSelectedAttachment = useUIStore(state => state.setSelectedAttachment);
  
  const [volume, setVolume] = useState(subtitle?.audioTrack?.volume || 0.7);
  const [fadeIn, setFadeIn] = useState(subtitle?.audioTrack?.fadeIn || 0);
  const [fadeOut, setFadeOut] = useState(subtitle?.audioTrack?.fadeOut || 0);

  const handleClose = () => {
    setSelectedAttachment(null);
  };

  useEffect(() => {
    if (subtitle?.audioTrack) {
      setVolume(subtitle.audioTrack.volume);
      setFadeIn(subtitle.audioTrack.fadeIn);
      setFadeOut(subtitle.audioTrack.fadeOut);
    }
  }, [subtitle?.audioTrack]);

  useEffect(() => {
    if (!subtitle) {
      handleClose();
    }
  }, [subtitle]);

  const updateStore = (updates: Partial<SubtitleAudioData>) => {
    if (subtitle?.audioTrack) {
      setSubtitleAudio(subtitleId, { ...subtitle.audioTrack, ...updates });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    updateStore({ volume: newVolume });
  };
  
  const handleFadeInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFadeIn = parseFloat(e.target.value);
    setFadeIn(newFadeIn);
    updateStore({ fadeIn: newFadeIn });
  };
  
  const handleFadeOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFadeOut = parseFloat(e.target.value);
    setFadeOut(newFadeOut);
    updateStore({ fadeOut: newFadeOut });
  };

  const handleFadeInToggle = (enabled: boolean) => {
    const newFadeIn = enabled ? 1.0 : 0.0;
    setFadeIn(newFadeIn);
    updateStore({ fadeIn: newFadeIn });
  };

  const handleFadeOutToggle = (enabled: boolean) => {
    const newFadeOut = enabled ? 1.0 : 0.0;
    setFadeOut(newFadeOut);
    updateStore({ fadeOut: newFadeOut });
  };

  if (!subtitle) {
    return null;
  }

  // 判断开关是否开启，用于控制滑块和数值框的显示
  const isFadeInEnabled = fadeIn > 0;
  const isFadeOutEnabled = fadeOut > 0;

  return (
    <div className="w-80 bg-gray-900 p-4 flex-shrink-0 flex flex-col" style={{width: 300, backgroundColor: '#18181B'}}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white text-lg font-semibold">音频</h3>
        <button 
          onClick={handleClose} 
          className="text-gray-400 hover:text-white text-2xl"
        >
          &times;
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* 音量 */}
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
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="w-20 flex-shrink-0 text-center bg-gray-800 text-white rounded-md px-3 py-1.5 text-sm">
              {Math.round(volume * 100)}%
            </div>
          </div>
        </div>
        
        {/* 淡入 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-300">淡入</label>
            <ToggleSwitch enabled={isFadeInEnabled} onChange={handleFadeInToggle} />
          </div>
          {/* 只有当开关开启时才显示滑块和数值框 */}
          {isFadeInEnabled && (
            <div className="flex items-center space-x-3 mt-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={fadeIn}
                onChange={handleFadeInChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="w-20 flex-shrink-0 text-center bg-gray-800 text-white rounded-md px-3 py-1.5 text-sm">
                {fadeIn.toFixed(1)}s
              </div>
            </div>
          )}
        </div>

        {/* 淡出 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-300">淡出</label>
            <ToggleSwitch enabled={isFadeOutEnabled} onChange={handleFadeOutToggle} />
          </div>
          {/* 只有当开关开启时才显示滑块和数值框 */}
          {isFadeOutEnabled && (
            <div className="flex items-center space-x-3 mt-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={fadeOut}
                onChange={handleFadeOutChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="w-20 flex-shrink-0 text-center bg-gray-800 text-white rounded-md px-3 py-1.5 text-sm">
                {fadeOut.toFixed(1)}s
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}