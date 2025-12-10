import { useState, useRef, useEffect } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  ForwardIcon,
  BackwardIcon,
  Cog6ToothIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  ClockIcon
} from '@heroicons/react/24/outline'; 

import { useProjectStore } from '../../stores/useProjectStore';
import { useSubtitleStore } from '../../stores/useSubtitleStore';
import { useTextElementStore } from '../../stores/useTextElementStore';
import { useAudioStore } from '../../stores/useAudioStore';
import { useVideoSequenceStore } from '../../stores/useVideoSequenceStore'; 
import { 
  useUIStore, 
  useSelectedAttachment, 
  useTimelineCollapsed 
} from '../../stores/useUIStore';
import { formatTime } from '../../utils/videoUtils';

function SettingsMenu({ onSkip, onSetRate, playbackRate }: {
  onSkip: (seconds: number) => void;
  onSetRate: (rate: number) => void;
  playbackRate: number;
}) {
  const [isPlaybackRateOpen, setIsPlaybackRateOpen] = useState(false);
  const rates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  const handleSetRate = (rate: number) => {
    onSetRate(rate);
    setIsPlaybackRateOpen(false);
  };

  return (
    <div 
      // 【关键修复 1】添加 z-[100]：这是之前代码缺少的，确保它一定在视频图层上面
      // 【关键修复 2】移除 overflow-hidden：确保内部弹窗不被切断
      className="absolute bottom-12 right-0 w-48 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-white/10 z-[100] mb-2"
      onClick={(e) => e.stopPropagation()} 
    >
      <div className="flex items-center justify-between p-2 border-b border-white/10">
        <span className="text-xs text-white/70">跳过</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onSkip(-10)}
            className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          >
            <BackwardIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => onSkip(10)}
            className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          >
            <ForwardIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="relative">
        <button 
          onClick={() => setIsPlaybackRateOpen(prev => !prev)}
          className="flex items-center justify-between w-full p-2 text-left text-white/80 hover:text-white hover:bg-white/10 transition-colors rounded-b-lg"
        >
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-5 h-5" />
            <span className="text-xs">播放速度</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-white">{playbackRate}x</span>
            {isPlaybackRateOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </div>
        </button>

        {isPlaybackRateOpen && (
          <div 
            // 【关键修复 3】添加 z-[100]：确保子菜单也在最上层
            className="absolute bottom-full left-0 right-0 bg-gray-900 border border-white/10 rounded-lg p-1 mb-1 max-h-40 overflow-y-auto z-[100]"
          >
            {rates.map(rate => (
              <button
                key={rate}
                onClick={() => handleSetRate(rate)}
                className={`w-full text-left text-xs p-1.5 rounded ${
                  playbackRate === rate 
                    ? 'bg-purple-600 text-white' 
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function VideoControls() {
  const { 
    isPlaying, 
    volume, 
    togglePlayback, 
    setVolume, 
    globalTime,
    globalDuration,
    setGlobalTime,
    playbackRate,
    setPlaybackRate 
  } = useProjectStore();
  
  const { 
    removeSubtitleAudio, 
    removeSubtitleSoundEffect, 
    removeSubtitleBroll,
    updateSubtitle // [新增] 引入更新方法，用于重置混音参数
  } = useSubtitleStore();
  
  const { deleteTextElement } = useTextElementStore();
  const { removeBackgroundMusic } = useAudioStore();
  const { removeSegment } = useVideoSequenceStore();
  
  const { 
    toggleTimelineCollapsed, 
    videoToolbar,
    setSelectedAttachment,
    clearSelectedTextElements,
    clearVideoToolbar
  } = useUIStore();
  const selectedAttachment = useSelectedAttachment();
  const timelineCollapsed = useTimelineCollapsed(); 

  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const progressRef = useRef<HTMLDivElement>(null);

  const currentTimeFormatted = formatTime(globalTime || 0);
  const durationFormatted = formatTime(globalDuration || 0);
  const progressPercentage = globalDuration ? (globalTime || 0) / globalDuration * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressRef.current || !globalDuration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * globalDuration;
    setGlobalTime(Math.max(0, Math.min(globalDuration, newTime)));
  };

  const handleProgressMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleProgressClick(e);
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!progressRef.current || !globalDuration) return;
      const rect = progressRef.current.getBoundingClientRect();
      const moveX = moveEvent.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, moveX / rect.width));
      const newTime = percentage * globalDuration;
      setGlobalTime(newTime);
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
    if (!isDragging) handleProgressClick(e);
  };

  const handleSkip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(globalDuration || 0, (globalTime || 0) + seconds));
    setGlobalTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const toggleMute = () => {
    setVolume(volume > 0 ? 0 : 80); 
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('全屏操作失败:', error);
    }
  };

  const handleToggleTimeline = () => {
    toggleTimelineCollapsed();
  };

  const handleDeleteSelected = () => {
    if (selectedAttachment) {
      const { type, subtitleId } = selectedAttachment;
      switch (type) {
        case 'audio':
          // @ts-ignore
          removeSubtitleAudio(subtitleId);
          // [关键修复] 删除配音时，必须重置混音参数，否则播放器仍会处于“编辑模式”导致静音
          updateSubtitle(subtitleId, { sourceMix: undefined });
          break;
        case 'soundEffect':
          // @ts-ignore
          removeSubtitleSoundEffect(subtitleId);
          // [关键修复] 删除音效时，也重置混音参数，恢复主视频原声
          updateSubtitle(subtitleId, { sourceMix: undefined });
          break;
        case 'broll':
          // @ts-ignore
          removeSubtitleBroll(subtitleId);
          break;
        case 'backgroundMusic':
          removeBackgroundMusic();
          break;
        case 'videoSequence':
          removeSegment(selectedAttachment.segmentId);
          break;
        default:
          break;
      }
      setSelectedAttachment(null);
    } 
    else if (videoToolbar.visible && videoToolbar.targetId && videoToolbar.targetType === 'textElement') {
      deleteTextElement(videoToolbar.targetId);
      clearSelectedTextElements();
      clearVideoToolbar();
    }
  };

  const canDelete = selectedAttachment !== null || (videoToolbar.visible && videoToolbar.targetId !== null && videoToolbar.targetType === 'textElement');

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    const handleClickOutside = (_event: MouseEvent) => {
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('click', handleClickOutside); 
    };
  }, [isSettingsOpen]); 
  
  return (
    <div className="w-full bg-transparent">
      <div 
        ref={progressRef}
        className="w-full h-2 bg-white/20 cursor-pointer relative" 
        onClick={handleProgressClickWhenNotDragging}
        onMouseDown={handleProgressMouseDown}
      >
        <div 
          className="h-full bg-purple-500"
          style={{ width: `${progressPercentage}%` }}
        />
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transition-opacity" 
          style={{ left: `${progressPercentage}%`, marginLeft: '-6px' }}
        />
      </div>

      <div className="flex items-center p-2 bg-gradient-to-t from-black/80 to-transparent relative">
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleTimeline}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center transition-colors text-white"
            title={timelineCollapsed ? "展开时间轴" : "折叠时间轴"}
          >
            {timelineCollapsed ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={!canDelete}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              canDelete
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
            title={canDelete ? "删除选中元素" : "未选中任何可删除元素"}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center space-x-4">
          <span className="text-white text-sm font-mono w-16 text-right">{currentTimeFormatted}</span>
          
          <button
            onClick={togglePlayback}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5 text-white" />
            ) : (
              <PlayIcon className="w-5 h-5 text-white ml-0.5" /> 
            )}
          </button>
          
          <span className="text-white/80 text-sm font-mono w-16 text-left">{durationFormatted}</span>
        </div>

        <div className="flex items-center space-x-2 ml-auto">
          <div 
            className="flex items-center space-x-2"
            onMouseEnter={() => setIsVolumeHovered(true)}
            onMouseLeave={() => setIsVolumeHovered(false)}
          >
            <button onClick={toggleMute} className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors">
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
                max="100"
                step="1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(prev => !prev); }}
              className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
            
            {isSettingsOpen && (
              <SettingsMenu 
                onSkip={handleSkip} 
                onSetRate={setPlaybackRate} 
                playbackRate={playbackRate} 
              />
            )}
          </div>

          <button 
            onClick={toggleFullscreen}
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
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