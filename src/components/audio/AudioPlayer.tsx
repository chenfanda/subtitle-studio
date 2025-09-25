import { useRef, useEffect } from 'react';
import { useAudioStore } from '@/stores/useAudioStore';

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { 
    currentTrack, 
    isPlaying, 
    volume, 
    setCurrentTime,
    stopAudio
  } = useAudioStore();

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.url;
      audioRef.current.volume = currentTrack.volume;
      
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    } else if (audioRef.current && !currentTrack) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime * 1000);
    };

    const handleEnded = () => {
      stopAudio();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [setCurrentTime, stopAudio]);

  return <audio ref={audioRef} />;
}