import { useMemo } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';

interface VideoSourceState {
  activeSourceUrl: string;
  isInsertClip: boolean;
  playbackOffset: number;
}

export function useVideoSourceSwitcher(): VideoSourceState {
  const currentTime = useProjectStore((state) => state.currentTime);
  const videoUrl = useProjectStore((state) => state.videoUrl);

  const { clips } = useVideoSequenceStore();

  const currentTimeMs = currentTime * 1000;

  const activeSourceData = useMemo(() => {
    const defaultSource: VideoSourceState = {
      activeSourceUrl: videoUrl,
      isInsertClip: false,
      playbackOffset: currentTime,
    };

    const activeClip = clips.find(clip => {
      const startTime = clip.insertAtTime;
      const endTime = clip.insertAtTime + clip.duration;
      return currentTimeMs >= startTime && currentTimeMs < endTime;
    });

    if (!activeClip) {
      return defaultSource;
    }

    const relativeTimeMs = currentTimeMs - activeClip.insertAtTime;
    const relativeTimeSec = relativeTimeMs / 1000;

    return {
      activeSourceUrl: activeClip.sourceUrl,
      isInsertClip: true,
      playbackOffset: relativeTimeSec,
    };

  }, [currentTime, currentTimeMs, clips, videoUrl]);

  return activeSourceData;
}