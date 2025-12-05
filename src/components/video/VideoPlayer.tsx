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

    // --- 1. 处理 Cut 逻辑 (修复版) ---
    if (isCutSegment) {
      const storeTime = useProjectStore.getState().globalTime;
      const currentTimeMs = storeTime * 1000;
      
      const activeSegment = segments.find(segment => {
        const endTime = segment.globalStartTime + segment.duration;
        // 使用一个微小的容差，防止浮点数计算导致的边界问题
        return segment.type === 'cut' && 
               currentTimeMs >= segment.globalStartTime - 1 && 
               currentTimeMs < endTime; // 注意这里用 < 而不是 <=，防止卡在结束点
      });

      if (activeSegment) {
        const segmentEndTime = (activeSegment.globalStartTime + activeSegment.duration) / 1000;
        
        // 只有当需要大幅度跳转时才更新，避免死循环
        if (Math.abs(storeTime - segmentEndTime) > 0.01) {
          setGlobalTime(segmentEndTime);
        }
      }

      // [关键修复]：立即暂停底层视频播放！
      // 防止在 React 状态更新完成前，视频继续播放出"被剪切"的画面。
      // 下一次渲染时，因为 isPlaying 仍为 true 且 isCutSegment 变为 false，视频会自动恢复播放。
      safePause(mainPlayer);
      safePause(insertPlayer);
      
      return; 
    }

    // --- 2. 确定当前活跃与非活跃播放器 ---
    const activePlayer = isInsertClip ? insertPlayer : mainPlayer;
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

  // ... (handleInsertEnded, handleTimeUpdate, handleMetadataLoaded 等其余代码保持不变) ...

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
  
  const handleMetadataLoaded = (_event: React.SyntheticEvent<HTMLVideoElement>) => {
    const mainPlayer = mainVideoRef.current;
    if (mainPlayer && mainPlayer.duration) {
      const newDuration = mainPlayer.duration;
      if (useProjectStore.getState().duration !== newDuration) {
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
    objectFit: 'contain',
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
        onEnded={handleInsertEnded}
      />
      <SourceAudioMixer />
    </div>
  );
}