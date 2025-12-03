import { useRef, useEffect } from 'react';
import { useAudioStore } from '@/stores/useAudioStore';

export function AudioPreviewPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    previewTrack,
    isPreviewPlaying,
    previewVolume,
    stopPreview,
  } = useAudioStore();


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (previewTrack) {
      if (audio.src !== previewTrack.url) {
        audio.src = previewTrack.url;
      }
      
      if (isPreviewPlaying) {
        audio.play().catch(console.error);
      } else {
        audio.pause();
      }
    } else {
      // 如果没有预览曲目，确保暂停并重置
      audio.pause();
      audio.src = '';
    }
  }, [previewTrack, isPreviewPlaying]);

  // 当音量变化时，同步音量
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = previewVolume / 100;
    }
  }, [previewVolume]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {

    };

    const handleEnded = () => {
      stopPreview(); 
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [stopPreview]);

  return <audio ref={audioRef} />;
}
