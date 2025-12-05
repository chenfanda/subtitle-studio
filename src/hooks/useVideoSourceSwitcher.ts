import { useMemo } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';

export interface VideoSourceState {
  // 基础信息
  activeSourceUrl: string;
  playbackOffset: number;
  
  // 新增：用于 UI 识别片段是否真正切换了 (防止仅仅是时间变化导致的重渲染)
  segmentId: string | number; 
  
  // 新增：预加载信息，告诉备用播放器该缓冲什么
  nextSourceUrl: string | null;
  nextStartTime: number;

  // 原有状态
  isInsertClip: boolean;
  isCutSegment: boolean;
  isGlobalTime: boolean;
  timeMapping: { globalStartTime: number; localStartTime: number } | null;
}

export function useVideoSourceSwitcher(): VideoSourceState {
  const globalTime = useProjectStore((state) => state.globalTime);
  const videoUrl = useProjectStore((state) => state.videoUrl);
  const segments = useVideoSequenceStore((state) => state.segments);

  const currentTimeMs = globalTime * 1000;

  const activeSourceData = useMemo((): VideoSourceState => {
    // 默认兜底状态
    const defaultSource: VideoSourceState = {
      activeSourceUrl: videoUrl,
      playbackOffset: globalTime,
      segmentId: 'default-main', // 唯一标识
      nextSourceUrl: null,
      nextStartTime: 0,
      isInsertClip: false,
      isCutSegment: false,
      isGlobalTime: true,
      timeMapping: null,
    };

    if (!segments || segments.length === 0) {
      return defaultSource;
    }

    // 1. 查找当前片段的 Index，以便我们能找到 Next
    const activeIndex = segments.findIndex(segment => {
      const endTime = segment.globalStartTime + segment.duration;
      return currentTimeMs >= segment.globalStartTime && currentTimeMs < endTime;
    });

    // 2. 处理未找到当前片段的情况（通常是播放到了末尾）
    if (activeIndex === -1) {
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        // ... (保持你原有的末尾逻辑)
        return {
          activeSourceUrl: lastSegment.sourceUrl,
          playbackOffset: (lastSegment.sourceStartTime + lastSegment.duration) / 1000,
          segmentId: `segment-${segments.length - 1}`, // 使用索引作为 ID
          nextSourceUrl: null,
          nextStartTime: 0,
          isInsertClip: lastSegment.type === 'insert',
          isCutSegment: lastSegment.type === 'cut',
          isGlobalTime: false,
          timeMapping: { 
            globalStartTime: lastSegment.globalStartTime / 1000, 
            localStartTime: lastSegment.sourceStartTime / 1000 
          },
        };
      }
      return defaultSource;
    }

    // 3. 获取当前片段信息
    const activeSegment = segments[activeIndex];
    const globalStartTime = activeSegment.globalStartTime / 1000;
    const localStartTime = activeSegment.sourceStartTime / 1000;
    const relativeTimeMs = currentTimeMs - activeSegment.globalStartTime;
    const playbackOffset = localStartTime + (relativeTimeMs / 1000);

    // 4. 获取下一个片段信息 (用于预加载)
    const nextSegment = segments[activeIndex + 1];
    const nextSourceUrl = nextSegment ? nextSegment.sourceUrl : null;
    const nextStartTime = nextSegment ? nextSegment.sourceStartTime / 1000 : 0;

    return {
      activeSourceUrl: activeSegment.sourceUrl,
      playbackOffset: playbackOffset,
      segmentId: `segment-${activeIndex}`, // 关键：当 ID 变化时，UI 才知道要切换视频源
      
      // 预加载数据
      nextSourceUrl,
      nextStartTime,

      isInsertClip: activeSegment.type === 'insert',
      isCutSegment: activeSegment.type === 'cut',
      isGlobalTime: false,
      timeMapping: { globalStartTime, localStartTime },
    };

  }, [globalTime, currentTimeMs, segments, videoUrl]);

  return activeSourceData;
}