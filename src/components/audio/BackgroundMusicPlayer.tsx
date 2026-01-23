// BackgroundMusicPlayer.tsx

import React, { useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useAudioStore } from '@/stores/useAudioStore';

export const BackgroundMusicPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameId = useRef<number | null>(null);


  const isPlaying = useProjectStore((state) => state.isPlaying);
  const globalTime = useProjectStore((state) => state.globalTime);
  const masterVolume = useProjectStore((state) => state.volume); 


  const backgroundMusic = useAudioStore((state) => state.backgroundMusic);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (backgroundMusic) {
      if (audio.src !== backgroundMusic.url) {
        audio.src = backgroundMusic.url;
      }

      audio.volume = (backgroundMusic.volume ?? 0.7) * (masterVolume / 100);
    } else {
      audio.src = '';
    }
  }, [backgroundMusic, masterVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !backgroundMusic) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      return;
    }

    const syncTime = () => {
      if (!audio) return;
      const timeDifference = Math.abs(audio.currentTime - globalTime);
      
      if (timeDifference > 0.2) {
        audio.currentTime = globalTime;
      }
      animationFrameId.current = requestAnimationFrame(syncTime);
    };

    if (isPlaying) {
      audio.play().catch(console.error);
      animationFrameId.current = requestAnimationFrame(syncTime);
    } else {
      audio.pause();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      const timeDifference = Math.abs(audio.currentTime - globalTime);
      if (timeDifference > 0.2) {
        audio.currentTime = globalTime;
      }
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, globalTime, backgroundMusic]);

  return <audio ref={audioRef} loop />;
};