import { useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import type { BrollVideoData } from '@/types/broll';
import type { SubtitleItem } from '@/types/subtitle';

interface BrollVideoPlayerProps {
  brollData: BrollVideoData;
  subtitle: SubtitleItem;
}

export function BrollVideoPlayer({ brollData, subtitle }: BrollVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { currentTime, isPlaying, volume } = useProjectStore();

  useEffect(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.play().catch(err => {
        console.error('B-roll video play failed:', err);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);


  useEffect(() => {
    if (!videoRef.current) return;

    const currentTimeMs = currentTime * 1000;


    const subtitleProgress = currentTimeMs - subtitle.startTime;
    const brollTime = (brollData.startOffset || 0) + (subtitleProgress / 1000);

    if (Math.abs(videoRef.current.currentTime - brollTime) > 0.1) {
      videoRef.current.currentTime = Math.max(0, brollTime);
    }
  }, [currentTime, subtitle.startTime, brollData.startOffset]);

  useEffect(() => {
    if (!videoRef.current) return;

    const finalVolume = (brollData.volume / 100) * (volume / 100);
    videoRef.current.volume = Math.max(0, Math.min(1, finalVolume));
  }, [brollData.volume, volume]);

  const getTransitionStyle = (): React.CSSProperties => {
    const currentTimeMs = currentTime * 1000;
    const progress = (currentTimeMs - subtitle.startTime) / (subtitle.endTime - subtitle.startTime);

    switch (brollData.transition) {
      case 'fade':
        if (progress < 0.1) {
          return {
            opacity: progress * 10,
            transition: 'opacity 0.3s ease-in-out'
          };
        }
        if (progress > 0.9) {
          return {
            opacity: (1 - progress) * 10,
            transition: 'opacity 0.3s ease-in-out'
          };
        }
        return { opacity: 1 };

      case 'glow':
        if (progress < 0.1 || progress > 0.9) {
          const glowIntensity = progress < 0.1
            ? progress * 10
            : (1 - progress) * 10;
          return {
            filter: `brightness(${1 + glowIntensity * 0.3})`,
            boxShadow: `0 0 ${30 * glowIntensity}px rgba(255, 255, 255, ${0.5 * glowIntensity})`,
            transition: 'all 0.3s ease-in-out'
          };
        }
        return {};

      default:
        return {};
    }
  };

  return (
    <video
      ref={videoRef}
      src={brollData.video.url}
      className="absolute inset-0 w-full h-full object-cover"
      style={getTransitionStyle()}
      loop={false}
      playsInline
      muted={false}
    />
  );
}