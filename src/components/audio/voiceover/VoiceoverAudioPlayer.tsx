import { useRef, useEffect, useState } from 'react';
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
  
  
  const [isReady, setIsReady] = useState(false);

  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const shouldPlay = isPlaying && !isInsertClip;

    if (shouldPlay) {
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          
          if (error.name !== 'AbortError') {
            console.error("Playback error:", error);
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, isInsertClip, audioData.track.url]); 

  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isInsertClip) return;

    const currentSourceTimeMs = playbackOffset * 1000;
    const subtitleProgress = currentSourceTimeMs - subtitle.startTime;
    const targetAudioTime = subtitleProgress / 1000;


    
    const currentTime = audio.currentTime;
    const timeDiff = Math.abs(currentTime - targetAudioTime);

    const SYNC_THRESHOLD = 0.25;

    if (timeDiff > SYNC_THRESHOLD) {
    
      const seekTime = Math.max(0, targetAudioTime);
      
      
      if (audio.duration && seekTime > audio.duration) {
         return; 
      }

      audio.currentTime = seekTime;
    }
  }, [playbackOffset, subtitle.startTime, isInsertClip]);

  
  useEffect(() => {
    if (!audioRef.current) return;
    
    
    const finalVolume = Math.max(0, Math.min(1, (audioData.volume) * (volume / 100)));
    audioRef.current.volume = finalVolume;
  }, [audioData.volume, volume]);

  return (
    <audio
      ref={audioRef}
      src={audioData.track.url}
      preload="auto" 
      loop={false}
      playsInline
      muted={false}
      
      onCanPlay={() => setIsReady(true)}
  
      onError={(e) => console.warn("Audio load error", e)}
    />
  );
}