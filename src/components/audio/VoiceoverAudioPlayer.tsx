import { useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import type { SubtitleAudioData, SubtitleItem } from '@/types/subtitle';

interface VoiceoverAudioPlayerProps {
  audioData: SubtitleAudioData;
  subtitle: SubtitleItem;
}

export function VoiceoverAudioPlayer({ audioData, subtitle }: VoiceoverAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentTime, isPlaying, volume } = useProjectStore();

  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;

    const currentTimeMs = currentTime * 1000;
    const subtitleProgress = currentTimeMs - subtitle.startTime;
    const audioTime = subtitleProgress / 1000;

    if (Math.abs(audioRef.current.currentTime - audioTime) > 0.1) {
      audioRef.current.currentTime = Math.max(0, audioTime);
    }
  }, [currentTime, subtitle.startTime]);

  useEffect(() => {
    if (!audioRef.current) return;
    
    const finalVolume = (audioData.volume) * (volume / 100);
    audioRef.current.volume = Math.max(0, Math.min(1, finalVolume));
  }, [audioData.volume, volume]);

  return (
    <audio
      ref={audioRef}
      src={audioData.track.url}
      loop={false}
      playsInline
      muted={false}
    />
  );
}