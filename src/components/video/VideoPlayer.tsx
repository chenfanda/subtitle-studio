// src/components/video/VideoPlayer.tsx
import { useRef, useEffect } from 'react';
import ReactPlayer, { ReactPlayerProps } from 'react-player';
import { useProjectStore } from '../../stores/useProjectStore';

export function VideoPlayer() {
  const playerRef = useRef<ReactPlayer>(null);
  
  const { 
    videoUrl, 
    isPlaying, 
    volume, 
    currentTime, 
    setCurrentTime, 
    setDuration 
  } = useProjectStore();

  // 同步播放状态 - 添加防抖避免频繁跳转
  useEffect(() => {
    if (playerRef.current && currentTime !== undefined) {
      const playerCurrentTime = playerRef.current.getCurrentTime();
      // 增加容差到0.5秒，减少不必要的跳转
      if (Math.abs(playerCurrentTime - currentTime) > 0.5) {
        playerRef.current.seekTo(currentTime, 'seconds');
      }
    }
  }, [currentTime]);

  const handleProgress: ReactPlayerProps['onProgress'] = (progress) => {
    // 节流更新：减少状态更新频率，降低对时间轴组件的影响
    const currentTimeInSeconds = Math.floor(progress.playedSeconds * 10) / 10; // 保留1位小数
    
    // 只在时间真正变化时才更新状态
    if (currentTimeInSeconds !== currentTime) {
      setCurrentTime(currentTimeInSeconds);
    }
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handleReady = () => {
    console.log('Video player ready');
  };

  const handleError = (error: any) => {
    console.error('Video player error:', error);
  };

  return (
    <div className="w-full h-full rounded-xl overflow-hidden bg-black border-2 border-gray-600 relative">
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        playing={isPlaying}
        volume={volume/100}
        width="100%"
        height="100%"
        onProgress={handleProgress}
        onDuration={handleDuration}
        onReady={handleReady}
        onError={handleError}
        progressInterval={200} // 从100ms改为200ms，减少更新频率
        controls={false}
        config={{
          file: {
            attributes: {
              style: {
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }
            }
          }
        }}
        style={{
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
    </div>
  );
}