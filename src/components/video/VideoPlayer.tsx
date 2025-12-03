import { useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';
import { useVideoSourceSwitcher } from '@/hooks/useVideoSourceSwitcher';
import { SourceAudioMixer } from '@/components/audio/SourceAudioMixer';

interface VideoPlayerProps {
  isMutedOverride?: boolean;
}

const safePlay = (video: HTMLVideoElement) => {
  const promise = video.play();
  if (promise !== undefined) {
    promise.catch(() => {});
  }
};

const safePause = (video: HTMLVideoElement) => {
  if (!video.paused) {
    video.pause();
  }
};

export function VideoPlayer({ isMutedOverride = false }: VideoPlayerProps) {
  const { 
    isPlaying, 
    volume, 
    playbackRate, 
    setCurrentTime,
    setGlobalTime,
    globalDuration,
    setDuration,
  } = useProjectStore();

  const { 
    activeSourceUrl, 
    isInsertClip, 
    isCutSegment,
    playbackOffset,
    isGlobalTime,
    timeMapping 
  } = useVideoSourceSwitcher();

  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const insertVideoRef = useRef<HTMLVideoElement>(null);
  const segments = useVideoSequenceStore((state) => state.segments);

  const isSeekingRef = useRef(false);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const mainPlayer = mainVideoRef.current;
    const insertPlayer = insertVideoRef.current;

    if (!mainPlayer || !insertPlayer) return;

    if (isCutSegment) {
      const storeTime = useProjectStore.getState().globalTime;
      const currentTimeMs = storeTime * 1000;
      
      const activeSegment = segments.find(segment => {
        const endTime = segment.globalStartTime + segment.duration;
        return segment.type === 'cut' && 
               currentTimeMs >= segment.globalStartTime && 
               currentTimeMs <= endTime;
      });

      if (activeSegment) {
        const segmentEndTime = (activeSegment.globalStartTime + activeSegment.duration) / 1000;
        if (Math.abs(storeTime - segmentEndTime) > 0.001) {
          setGlobalTime(segmentEndTime);
        }
      }
      return; 
    }

    const activePlayer = isInsertClip ? insertPlayer : mainPlayer;
    const inactivePlayer = isInsertClip ? mainPlayer : insertPlayer;

    activePlayer.style.display = 'block';
    
    if (isInsertClip) {
      activePlayer.volume = isMutedOverride ? 0 : (volume / 100);
      activePlayer.muted = isMutedOverride || (volume === 0);
  
    } else {
      activePlayer.muted = true; 
    }
    
    activePlayer.playbackRate = playbackRate;

    inactivePlayer.style.display = 'none';
    safePause(inactivePlayer);

    let needsSeek = false;
    if (activeSourceUrl && activePlayer.src !== activeSourceUrl) {
      activePlayer.src = activeSourceUrl;
      needsSeek = true;
    }

    if (activeSourceUrl) {
      const timeDiff = Math.abs(activePlayer.currentTime - playbackOffset);
      if (needsSeek || timeDiff > 0.2) {
        isSeekingRef.current = true;
        activePlayer.currentTime = playbackOffset;

        if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
        seekTimeoutRef.current = setTimeout(() => {
          isSeekingRef.current = false;
        }, 250);
      }

      if (isPlaying) {
        safePlay(activePlayer);
      } else {
        safePause(activePlayer);
      }
    }
  }, [
    activeSourceUrl, isInsertClip, playbackOffset, isPlaying, 
    volume, playbackRate, isCutSegment, segments, setGlobalTime, isMutedOverride
  ]);

  const handleInsertEnded = () => {
    if (isInsertClip) {
      const storeTime = useProjectStore.getState().globalTime;
      const currentTimeMs = storeTime * 1000;
      const activeSegment = segments.find(segment => {
        const endTime = segment.globalStartTime + segment.duration;
        const epsilon = 10; 
        return segment.type === 'insert' && 
               currentTimeMs >= segment.globalStartTime - epsilon && 
               currentTimeMs <= endTime + epsilon;
      });

      if (activeSegment) {
        const segmentEndTime = (activeSegment.globalStartTime + activeSegment.duration) / 1000;
        setGlobalTime(segmentEndTime);
      }
    }
  };

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    if (isSeekingRef.current) {
      return;
    }

    const activePlayer = isInsertClip ? insertVideoRef.current : mainVideoRef.current;
    if (event.currentTarget === activePlayer && activePlayer) {
      const playerTime = activePlayer.currentTime;
      const storeGlobalTime = useProjectStore.getState().globalTime;
      const storeMainVideoTime = useProjectStore.getState().currentTime;
      
      let newGlobalTime: number;

      if (isGlobalTime || !timeMapping) {
        newGlobalTime = playerTime;
      } else {
        const { globalStartTime, localStartTime } = timeMapping;
        const timeDelta = playerTime - localStartTime;
        newGlobalTime = globalStartTime + timeDelta;
      }

      if (newGlobalTime < 0) newGlobalTime = 0;
      if (newGlobalTime > globalDuration) newGlobalTime = globalDuration;

      if (isInsertClip) {
        if (newGlobalTime !== storeGlobalTime && !isNaN(newGlobalTime)) {
          setGlobalTime(newGlobalTime);
        }
      } else {
        const newMainVideoTime = playerTime;
        if (newGlobalTime !== storeGlobalTime && !isNaN(newGlobalTime)) {
          setGlobalTime(newGlobalTime);
        }
        if (newMainVideoTime !== storeMainVideoTime && !isNaN(newMainVideoTime)) {
          setCurrentTime(newMainVideoTime);
        }
      }
    }
  };
  
  const handleMetadataLoaded = (_event: React.SyntheticEvent<HTMLVideoElement>) => {
    const mainPlayer = mainVideoRef.current;
    if (mainPlayer && mainPlayer.duration) {
      const newDuration = mainPlayer.duration;
      if (useProjectStore.getState().duration !== newDuration) {
        setDuration(newDuration);
      }
    }
  };

  return (
    <div className="w-full h-full bg-black relative rounded-xl overflow-hidden">
      <video
        ref={mainVideoRef}
        className="w-full h-full object-contain"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleMetadataLoaded}
        muted
      />
      <video
        ref={insertVideoRef}
        className="w-full h-full object-contain"
        style={{ display: 'none' }}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleInsertEnded}
      />

      <SourceAudioMixer />
    </div>
  );
}