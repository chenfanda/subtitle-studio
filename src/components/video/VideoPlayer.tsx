import { useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useVideoSourceSwitcher } from '@/hooks/useVideoSourceSwitcher';

const safePlay = (video: HTMLVideoElement) => {
  const promise = video.play();
  if (promise !== undefined) {
    promise.catch(error => {
      console.warn("Video play interrupted:", error);
    });
  }
};

const safePause = (video: HTMLVideoElement) => {
  if (!video.paused) {
    video.pause();
  }
};

export function VideoPlayer() {
  const { 
    isPlaying, 
    volume, 
    playbackRate, 
    setCurrentTime,
    currentTime
  } = useProjectStore();

  const { activeSourceUrl, isInsertClip, playbackOffset } = useVideoSourceSwitcher();

  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const insertVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mainPlayer = mainVideoRef.current;
    const insertPlayer = insertVideoRef.current;

    if (!mainPlayer || !insertPlayer) {
      return;
    }

    const activePlayer = isInsertClip ? insertPlayer : mainPlayer;
    const inactivePlayer = isInsertClip ? mainPlayer : insertPlayer;

    activePlayer.style.display = 'block';
    activePlayer.muted = false;
    activePlayer.volume = volume / 100;
    activePlayer.playbackRate = playbackRate;

    inactivePlayer.style.display = 'none';
    inactivePlayer.muted = true;
    safePause(inactivePlayer);

    if (activeSourceUrl && activePlayer.src !== activeSourceUrl) {
      activePlayer.src = activeSourceUrl;
    }

    if (activeSourceUrl) {
      const timeDiff = Math.abs(activePlayer.currentTime - playbackOffset);
      
      if (timeDiff > 0.25) {
        activePlayer.currentTime = playbackOffset;
      }

      if (isPlaying) {
        safePlay(activePlayer);
      } else {
        safePause(activePlayer);
      }
    }

  }, [
    activeSourceUrl, 
    isInsertClip, 
    playbackOffset,
    isPlaying, 
    volume, 
    playbackRate
  ]);

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const activePlayer = isInsertClip ? insertVideoRef.current : mainVideoRef.current;
    
    if (event.currentTarget === activePlayer && activePlayer) {
      const playerTime = activePlayer.currentTime;
      const storeTime = useProjectStore.getState().currentTime;
      
      const roundedPlayerTime = Math.floor(playerTime * 10) / 10;

      if (roundedPlayerTime !== storeTime) {
        setCurrentTime(roundedPlayerTime);
      }
    }
  };

  return (
    <div className="w-full h-full bg-black relative rounded-xl overflow-hidden">
      <video
        ref={mainVideoRef}
        className="w-full h-full object-contain"
        playsInline
        muted
        onTimeUpdate={handleTimeUpdate}
      />
      <video
        ref={insertVideoRef}
        className="w-full h-full object-contain"
        style={{ display: 'none' }}
        playsInline
        muted
        onTimeUpdate={handleTimeUpdate}
      />
    </div>
  );
}