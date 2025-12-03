import { useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useVideoSourceSwitcher } from '@/hooks/useVideoSourceSwitcher';
import type { SubtitleAudioData, SubtitleItem } from '@/types/subtitle';

interface VoiceoverAudioPlayerProps {
  audioData: SubtitleAudioData;
  subtitle: SubtitleItem;
}

export function VoiceoverAudioPlayer({ audioData, subtitle }: VoiceoverAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isPlaying, volume } = useProjectStore();
  const { isInsertClip, playbackOffset } = useVideoSourceSwitcher();

  useEffect(() => {
    if (!audioRef.current) return;

    const shouldPlay = isPlaying && !isInsertClip;

    if (shouldPlay) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isInsertClip]);

  useEffect(() => {
    if (!audioRef.current || isInsertClip) return;

    const currentSourceTimeMs = playbackOffset * 1000;
    const subtitleProgress = currentSourceTimeMs - subtitle.startTime;
    const audioTime = subtitleProgress / 1000;

    if (Math.abs(audioRef.current.currentTime - audioTime) > 0.1) {
      audioRef.current.currentTime = Math.max(0, audioTime);
    }
  }, [playbackOffset, subtitle.startTime, isInsertClip]);

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