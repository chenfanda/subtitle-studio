import { useRef, useEffect } from 'react';
import ReactPlayer, { ReactPlayerProps } from 'react-player';
import { useProjectStore } from '../../stores/useProjectStore';

interface VideoPlayerProps {
  isMutedOverride?: boolean;
}

export function VideoPlayer({ isMutedOverride = false }: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  
  const { 
    videoUrl, 
    isPlaying, 
    volume, 
    currentTime, 
    setCurrentTime, 
    setDuration 
  } = useProjectStore();

  useEffect(() => {
    if (playerRef.current && currentTime !== undefined) {
      const playerCurrentTime = playerRef.current.getCurrentTime();
      if (Math.abs(playerCurrentTime - currentTime) > 0.5) {
        playerRef.current.seekTo(currentTime, 'seconds');
      }
    }
  }, [currentTime]);

  const handleProgress: ReactPlayerProps['onProgress'] = (progress) => {
    const currentTimeInSeconds = Math.floor(progress.playedSeconds * 10) / 10;
    
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
        muted={isMutedOverride}
        width="100%"
        height="100%"
        onProgress={handleProgress}
        onDuration={handleDuration}
        onReady={handleReady}
        onError={handleError}
        progressInterval={200}
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