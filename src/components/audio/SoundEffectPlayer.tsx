import React, { useRef, useEffect, useState } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useVideoSourceSwitcher } from '@/hooks/useVideoSourceSwitcher';
import type { SubtitleItem } from '@/types/subtitle';

interface AudioInstance {
  id: string;
  element: HTMLAudioElement;
  startTime: number;
  endTime: number;
  trackUrl: string;
  volume: number;
}

export const SoundEffectPlayer: React.FC = () => {
  const isPlaying = useProjectStore((state) => state.isPlaying);
  const masterVolume = useProjectStore((state) => state.volume);
  const subtitles = useSubtitleStore((state) => state.subtitles);
  
  const { isInsertClip, playbackOffset } = useVideoSourceSwitcher();

  const [activeAudios, setActiveAudios] = useState<AudioInstance[]>([]);
  const audioPool = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    
    if (isInsertClip) {
      setActiveAudios([]);
      return;
    }


    const currentSourceTimeMs = playbackOffset * 1000;
    const newActiveAudios: AudioInstance[] = [];

    subtitles.forEach((sub: SubtitleItem) => {
      if (sub.soundEffect) {
        const id = `${sub.id}-sfx`;
        const startTime = sub.startTime;
        const endTime = sub.endTime;

      
        if (currentSourceTimeMs >= startTime && currentSourceTimeMs < endTime) {
          
        
          const rawVolume = (sub.soundEffect.volume ?? 0.7) * (masterVolume / 100);
          const safeVolume = Math.min(1, Math.max(0, rawVolume));

          newActiveAudios.push({
            id,
            element: new Audio(),
            startTime,
            endTime,
            trackUrl: sub.soundEffect.track.url,
            volume: safeVolume,
          });
        }
      }
    });

    setActiveAudios(prevAudios => {
      if (
        prevAudios.length === newActiveAudios.length &&
        prevAudios.every((audio, index) => audio.id === newActiveAudios[index].id)
      ) {
        return prevAudios;
      }
      return newActiveAudios;
    });
  }, [playbackOffset, isInsertClip, subtitles, masterVolume]);


  useEffect(() => {
    const currentAudioElements = audioPool.current;

    activeAudios.forEach(audioData => {
      let audio = currentAudioElements.get(audioData.id);

      if (!audio) {
        audio = new Audio(audioData.trackUrl);
        currentAudioElements.set(audioData.id, audio);
      }
      
      if (audio.src !== audioData.trackUrl) {
          audio.src = audioData.trackUrl;
      }

      audio.volume = audioData.volume;

      const localTime = (playbackOffset * 1000 - audioData.startTime) / 1000;
      

      if (Math.abs(audio.currentTime - localTime) > 0.2) {
        audio.currentTime = Math.max(0, localTime);
      }

      if (isPlaying && !isInsertClip) {
        if (audio.paused) {
          audio.play().catch(console.error);
        }
      } else {
        if (!audio.paused) {
          audio.pause();
        }
      }
    });

    currentAudioElements.forEach((audio, id) => {
      if (!activeAudios.some(a => a.id === id)) {
        if (!audio.paused) {
          audio.pause();
        }
   
      }
    });

  }, [isPlaying, playbackOffset, isInsertClip, activeAudios]);

  useEffect(() => {
    return () => {
      audioPool.current.forEach(audio => audio.pause());
      audioPool.current.clear();
    };
  }, []);

  return null;
};