// src/components/video/VideoControls.tsx
import { useState, useRef } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  ForwardIcon,
  BackwardIcon,
  Cog6ToothIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/solid';
import { useProjectStore } from '../../stores/useProjectStore';
import { formatTime } from '../../utils/videoUtils';

export function VideoControls() {
  const { isPlaying, volume, togglePlayback, setVolume } = useProjectStore();
  const { currentTime, duration, setCurrentTime } = useProjectStore();
  
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const currentTimeFormatted = formatTime(currentTime || 0);
  const durationFormatted = formatTime(duration || 0);
  const progressPercentage = duration ? (currentTime || 0) / duration * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    setCurrentTime(Math.max(0, Math.min(duration, newTime)));
  };

  const handleProgressMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleProgressClick(e);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!progressRef.current || !duration) return;
      
      const rect = progressRef.current.getBoundingClientRect();
      const moveX = moveEvent.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, moveX / rect.width));
      const newTime = percentage * duration;
      
      setCurrentTime(newTime);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleProgressClickWhenNotDragging = (e: React.MouseEvent) => {
    if (!isDragging) {
      handleProgressClick(e);
    }
  };

  const handleSkip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration || 0, (currentTime || 0) + seconds));
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const toggleMute = () => {
    setVolume(volume > 0 ? 0 : 0.8);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // 进入全屏
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        // 退出全屏
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('全屏操作失败:', error);
    }
  };

  // 监听全屏状态变化
  useState(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  });

  return (
    <div className="w-full bg-transparent">
      {/* 进度条 */}
      <div 
        ref={progressRef}
        className="w-full h-1.5 bg-white/20 cursor-pointer relative group"
        onClick={handleProgressClickWhenNotDragging}
        onMouseDown={handleProgressMouseDown}
      >
        <div 
          className="h-full bg-purple-500 transition-all duration-100"
          style={{ width: `${progressPercentage}%` }}
        />
        
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progressPercentage}%`, marginLeft: '-8px' }}
        />
      </div>

      {/* 控制栏 */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleSkip(-10)}
            className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors"
          >
            <BackwardIcon className="w-5 h-5" />
            <span className="text-sm">10</span>
          </button>

          <button
            onClick={togglePlayback}
            className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <PauseIcon className="w-6 h-6 text-white" />
            ) : (
              <PlayIcon className="w-6 h-6 text-white ml-1" />
            )}
          </button>

          <button
            onClick={() => handleSkip(10)}
            className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors"
          >
            <ForwardIcon className="w-5 h-5" />
            <span className="text-sm">10</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-white text-sm font-mono">
          <span>{currentTimeFormatted}</span>
          <span className="text-white/60">/</span>
          <span className="text-white/80">{durationFormatted}</span>
        </div>

        <div className="flex items-center space-x-4">
          <div 
            className="flex items-center space-x-2"
            onMouseEnter={() => setIsVolumeHovered(true)}
            onMouseLeave={() => setIsVolumeHovered(false)}
          >
            <button onClick={toggleMute} className="text-white/80 hover:text-white transition-colors">
              {volume > 0 ? (
                <SpeakerWaveIcon className="w-5 h-5" />
              ) : (
                <SpeakerXMarkIcon className="w-5 h-5" />
              )}
            </button>
            
            <div className={`overflow-hidden transition-all duration-200 ${
              isVolumeHovered ? 'w-20 opacity-100' : 'w-0 opacity-0'
            }`}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          <button className="text-white/80 hover:text-white transition-colors">
            <Cog6ToothIcon className="w-5 h-5" />
          </button>

          <button 
            onClick={toggleFullscreen}
            className="text-white/80 hover:text-white transition-colors"
            title={isFullscreen ? "退出全屏" : "进入全屏"}
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="w-5 h-5" />
            ) : (
              <ArrowsPointingOutIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}