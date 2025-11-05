import { useMemo } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';

interface VideoSourceState {
  activeSourceUrl: string;
  isInsertClip: boolean;
  playbackOffset: number;
}

export function useVideoSourceSwitcher(): VideoSourceState {
  const currentTime = useProjectStore((state) => state.currentTime);
  const videoUrl = useProjectStore((state) => state.videoUrl);

  const segments = useVideoSequenceStore((state) => state.segments);
  const findSubtitleAtTime = useSubtitleStore.getState().findSubtitleAtTime;

  const currentTimeMs = currentTime * 1000;

  const activeSourceData = useMemo(() => {
    const defaultSource: VideoSourceState = {
      activeSourceUrl: videoUrl,
      isInsertClip: false,
      playbackOffset: currentTime,
    };

    const activeSubtitle = findSubtitleAtTime(currentTimeMs);
    if (activeSubtitle && activeSubtitle.brollVideo) {
      const brollData = activeSubtitle.brollVideo;
      const subtitleProgressMs = currentTimeMs - activeSubtitle.startTime;
      const brollTimeSec = (brollData.startOffset || 0) + (subtitleProgressMs / 1000);

      return {
        activeSourceUrl: brollData.video.url,
        isInsertClip: true,
        playbackOffset: brollTimeSec,
      };
    }

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
        return {
          activeSourceUrl: lastSegment.sourceUrl,
          isInsertClip: lastSegment.type === 'insert',
          playbackOffset: (lastSegment.sourceStartTime / 1000) + (lastSegment.duration / 1000),
        };
      }
      return defaultSource;
    }

    const relativeTimeMs = currentTimeMs - activeSegment.globalStartTime;
    const playbackOffset = (activeSegment.sourceStartTime / 1000) + (relativeTimeMs / 1000);

    return {
      activeSourceUrl: activeSegment.sourceUrl,
      isInsertClip: activeSegment.type === 'insert',
      playbackOffset: playbackOffset,
    };

  }, [currentTime, currentTimeMs, segments, videoUrl, findSubtitleAtTime]);

  return activeSourceData;
}