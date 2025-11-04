import { useAudioStore, useBackgroundMusic } from '@/stores/useAudioStore';
import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/useUIStore';

export function BackgroundMusicSettingsPanel() {
  const backgroundMusic = useBackgroundMusic();
  const adjustBackgroundVolume = useAudioStore(state => state.adjustBackgroundVolume);

  const setSelectedAttachment = useUIStore(state => state.setSelectedAttachment);

  const [volume, setVolume] = useState(backgroundMusic?.volume || 0.7);

  const handleClose = () => {
    setSelectedAttachment(null);
  };

  useEffect(() => {
    if (backgroundMusic) {
      setVolume(backgroundMusic.volume);
    } else {
      handleClose();
    }
  }, [backgroundMusic]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    adjustBackgroundVolume(newVolume);
  };

  if (!backgroundMusic) {
    return null;
  }

  return (
    
    <div className="w-50 bg-bg-primary p-4 flex-shrink-0 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white text-lg font-semibold">背景音乐</h3>
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