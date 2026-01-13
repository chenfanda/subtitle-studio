import { useRef, useEffect, useState } from 'react';
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
    promise.catch(() => { });
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
    setVideoMeta ,
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
        // 使用一个微小的容差，防止浮点数计算导致的边界问题
        return segment.type === 'cut' && 
               currentTimeMs >= segment.globalStartTime - 1 && 
               currentTimeMs < endTime; 
      });

      if (activeSegment) {
        const segmentEndTime = (activeSegment.globalStartTime + activeSegment.duration) / 1000;
        
        // 只有当需要大幅度跳转时才更新，避免死循环
        if (Math.abs(storeTime - segmentEndTime) > 0.01) {
          setGlobalTime(segmentEndTime);
        }
      }


      safePause(mainPlayer);
      safePause(insertPlayer);
      
      return; 
    }

    // --- 2. 确定当前活跃与非活跃播放器 ---
    const activePlayer = isInsertClip ? insertPlayer : mainPlayer;
    if (activePlayer.readyState >= 1) {
    const { videoMeta, setVideoMeta } = useProjectStore.getState();
    if (activePlayer.videoWidth !== videoMeta.width || activePlayer.videoHeight !== videoMeta.height) {
      setVideoMeta(activePlayer.videoWidth, activePlayer.videoHeight);
    }
  }
    const inactivePlayer = isInsertClip ? mainPlayer : insertPlayer;

    // --- 3. 设置基本属性 ---
    if (isInsertClip) {
      activePlayer.volume = isMutedOverride ? 0 : (volume / 100);
      activePlayer.muted = isMutedOverride || (volume === 0);
    } else {
      activePlayer.muted = true; 
    }
    activePlayer.playbackRate = playbackRate;

    // --- 4. 智能源切换与过渡逻辑 ---
    let needsSeek = false;
    const isSourceChanged = activeSourceUrl && activePlayer.src !== activeSourceUrl;

    if (isSourceChanged) {
      activePlayer.style.opacity = '0'; 
      activePlayer.src = activeSourceUrl;
      needsSeek = true;
    }

    if (activeSourceUrl) {
      const timeDiff = Math.abs(activePlayer.currentTime - playbackOffset);
      
      if (needsSeek || timeDiff > 0.25) { // 稍微放宽一点容差
        isSeekingRef.current = true;
        activePlayer.currentTime = playbackOffset;

        if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
        seekTimeoutRef.current = setTimeout(() => {
          isSeekingRef.current = false;
        }, 250);
      }

      if (isPlaying) {
        const playPromise = activePlayer.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            activePlayer.style.opacity = '1';
            activePlayer.style.zIndex = '10';
            setTimeout(() => {
              inactivePlayer.style.opacity = '0';
              inactivePlayer.style.zIndex = '0';
              safePause(inactivePlayer);
            }, 150); 
          }).catch(e => console.error("Play error", e));
        }
      } else {
        safePause(activePlayer);
        if (activePlayer.readyState >= 2) {
             activePlayer.style.opacity = '1';
             activePlayer.style.zIndex = '10';
             inactivePlayer.style.opacity = '0';
             inactivePlayer.style.zIndex = '0';
        }
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

      // 只有时间真正变化才更新
      if (Math.abs(newGlobalTime - storeGlobalTime) > 0.05) { 
        if (isInsertClip) {
            setGlobalTime(newGlobalTime);
        } else {
            setGlobalTime(newGlobalTime);
            if (Math.abs(playerTime - storeMainVideoTime) > 0.05) {
               setCurrentTime(playerTime);
            }
        }
      }
    }
  };
  
  const handleMetadataLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const { videoMeta, setVideoMeta, setDuration, duration: storeDuration } = useProjectStore.getState();

    const isActive = isInsertClip ? (video === insertVideoRef.current) : (video === mainVideoRef.current);

    if (isActive && video.videoWidth && video.videoHeight) {
      if (video.videoWidth !== videoMeta.width || video.videoHeight !== videoMeta.height) {
        setVideoMeta(video.videoWidth, video.videoHeight);
      }
    }

    if (video === mainVideoRef.current && video.duration) {
      const newDuration = video.duration;
      if (storeDuration !== newDuration) {
        setDuration(newDuration);
      }
    }
  };

  const commonVideoStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.2s ease-out',
    opacity: 0,
    zIndex: 0
  };

  return (
    <div className="w-full h-full bg-black relative rounded-xl overflow-hidden">
      <video
        ref={mainVideoRef}
        style={commonVideoStyle}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleMetadataLoaded}
        muted
      />
      <video
        ref={insertVideoRef}
        style={commonVideoStyle}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleMetadataLoaded}
        onEnded={handleInsertEnded}
      />
      <SourceAudioMixer />
    </div>
  );
}