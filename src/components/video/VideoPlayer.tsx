import { useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';
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
    setGlobalTime,
    globalDuration,
    setDuration 
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

  useEffect(() => {
    const mainPlayer = mainVideoRef.current;
    const insertPlayer = insertVideoRef.current;

    if (!mainPlayer || !insertPlayer) {
      return;
    }

    if (isCutSegment) {
      const storeTime = useProjectStore.getState().globalTime;
      const currentTimeMs = storeTime * 1000;
      
      const activeSegment = segments.find(segment => {
        const endTime = segment.globalStartTime + segment.duration;
        // 使用 <= 来处理边界，确保能找到
        return segment.type === 'cut' && 
               currentTimeMs >= segment.globalStartTime && 
               currentTimeMs <= endTime;
      });

      if (activeSegment) {
        // [修复 1] 移除 + 0.01
        // 精确地跳到片段的末尾
        const segmentEndTime = (activeSegment.globalStartTime + activeSegment.duration) / 1000;
        
        // 检查以防止无限循环
        if (Math.abs(storeTime - segmentEndTime) > 0.001) {
          setGlobalTime(segmentEndTime);
        }
      }
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

    let needsSeek = false;
    
    if (activeSourceUrl && activePlayer.src !== activeSourceUrl) {
      activePlayer.src = activeSourceUrl;
      needsSeek = true;
    }

    if (activeSourceUrl) {
      const timeDiff = Math.abs(activePlayer.currentTime - playbackOffset);
      
      if (needsSeek || timeDiff > 0.05) {
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
    playbackRate,
    isCutSegment, 
    segments,     
    setGlobalTime 
  ]);

  const handleInsertEnded = () => {
    if (isInsertClip) {
      console.warn('Video Sequence clip finished. Forcing time update.');
      
      const storeTime = useProjectStore.getState().globalTime;
      const currentTimeMs = storeTime * 1000;
      
      // [修复 2] 修复 handleInsertEnded 的边界逻辑
      const activeSegment = segments.find(segment => {
        const endTime = segment.globalStartTime + segment.duration;
        // 确保 (1) 它是 'insert' 类型
        // 确保 (2) 我们使用 <= endTime 来捕获 'onEnded' 时的精确边界
        // 使用一个小的容差（epsilon）来防止浮点数误差
        const epsilon = 10; // 10ms 容差
        return segment.type === 'insert' && 
               currentTimeMs >= segment.globalStartTime - epsilon && 
               currentTimeMs <= endTime + epsilon;
      });

      if (activeSegment) {
        // [修复 3] 移除 + 0.01
        // 精确地跳到片段的末尾
        const segmentEndTime = (activeSegment.globalStartTime + activeSegment.duration) / 1000;
        
        setGlobalTime(segmentEndTime);
      } else {
        console.error("handleInsertEnded: Could not find the active insert segment to jump from.", { currentTimeMs });
      }
    }
  };

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    // ... (此函数保持不变)
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
    // ... (此函数保持不变)
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
        muted
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleMetadataLoaded} 
      />
      <video
        ref={insertVideoRef}
        className="w-full h-full object-contain"
        style={{ display: 'none' }}
        playsInline
        muted
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleInsertEnded}
      />
    </div>
  );
}