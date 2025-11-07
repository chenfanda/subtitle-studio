import { useMemo } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';

export interface VideoSourceState {
  activeSourceUrl: string;
  isInsertClip: boolean;
  playbackOffset: number;
  isGlobalTime: boolean;
  timeMapping: { globalStartTime: number; localStartTime: number } | null;
}

export function useVideoSourceSwitcher(): VideoSourceState {
  const currentTime = useProjectStore((state) => state.currentTime);
  const videoUrl = useProjectStore((state) => state.videoUrl);

  const segments = useVideoSequenceStore((state) => state.segments);

  const currentTimeMs = currentTime * 1000;

  const activeSourceData = useMemo(() => {
    const defaultSource: VideoSourceState = {
      activeSourceUrl: videoUrl,
      isInsertClip: false,
      playbackOffset: currentTime,
      isGlobalTime: true,
      timeMapping: null,
    };

    if (!segments || segments.length === 0) {
      return defaultSource;
    }

    const activeSegment = segments.find(segment => {
      const endTime = segment.globalStartTime + segment.duration;
      return currentTimeMs >= segment.globalStartTime && currentTimeMs < endTime;
    });

    if (!activeSegment) {
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        const globalStartTime = lastSegment.globalStartTime / 1000;
        const localStartTime = lastSegment.sourceStartTime / 1000;
        const playbackOffset = localStartTime + (lastSegment.duration / 1000);
        
        return {
          activeSourceUrl: lastSegment.sourceUrl,
          isInsertClip: lastSegment.type === 'insert',
          playbackOffset: playbackOffset,
          isGlobalTime: false,
          timeMapping: { globalStartTime, localStartTime },
        };
      }
      return defaultSource;
    }

    const globalStartTime = activeSegment.globalStartTime / 1000;
    const localStartTime = activeSegment.sourceStartTime / 1000;
    const relativeTimeMs = currentTimeMs - activeSegment.globalStartTime;
    const playbackOffset = localStartTime + (relativeTimeMs / 1000);

    return {
      activeSourceUrl: activeSegment.sourceUrl,
      isInsertClip: activeSegment.type === 'insert',
      playbackOffset: playbackOffset,
      isGlobalTime: false,
      timeMapping: { globalStartTime, localStartTime },
    };

  }, [currentTime, currentTimeMs, segments, videoUrl]);

  return activeSourceData;
}