import { useRef, useEffect, memo } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { calculateVolumeAtTime } from '@/hooks/useVolumeMixer';
import { useVideoSourceSwitcher } from '@/hooks/useVideoSourceSwitcher';

export const SourceAudioMixer = memo(function SourceAudioMixer() {
  const vocalsRef = useRef<HTMLAudioElement>(null);
  const backingRef = useRef<HTMLAudioElement>(null);

  const isPlaying = useProjectStore(state => state.isPlaying);
  const playbackRate = useProjectStore(state => state.playbackRate);
  const sourceResources = useProjectStore(state => state.sourceResources);
  const globalTime = useProjectStore(state => state.globalTime);
  const masterVolume = useProjectStore(state => state.volume);
  const subtitles = useSubtitleStore(state => state.subtitles);
  const audioMix = useProjectStore(state => state.audioMix);

  const { isInsertClip, playbackOffset } = useVideoSourceSwitcher();
  const hasSeparatedTracks = !!(sourceResources?.audioVocals && sourceResources?.audioBacking);

  useEffect(() => {
    if (!hasSeparatedTracks) return;

    const volumes = calculateVolumeAtTime(playbackOffset, subtitles, masterVolume, hasSeparatedTracks,audioMix);

    if (vocalsRef.current) {
      vocalsRef.current.volume = volumes.vocals;
    }
    if (backingRef.current) {
      backingRef.current.volume = volumes.backing;
    }
  }, [globalTime, subtitles, masterVolume, hasSeparatedTracks,audioMix]);

  useEffect(() => {
    if (!hasSeparatedTracks || isInsertClip) return;
    const audios = [vocalsRef.current, backingRef.current];
    audios.forEach((audio) => {
      if (!audio) return;
      const diff = Math.abs(audio.currentTime - playbackOffset);
      if (diff > 0.25) {
        audio.currentTime = playbackOffset;
      }
    });
  }, [playbackOffset, hasSeparatedTracks, isInsertClip]);

  useEffect(() => {
    if (!hasSeparatedTracks) return;
    const audios = [vocalsRef.current, backingRef.current];
    audios.forEach((audio) => {
      if (!audio) return;
      if (audio.playbackRate !== playbackRate) {
        audio.playbackRate = playbackRate;
      }
      const shouldBePlaying = isPlaying && !isInsertClip;
      if (shouldBePlaying) {
        if (audio.paused) {
          audio.play().catch(() => {});
        }
      } else {
        if (!audio.paused) {
          audio.pause();
        }
      }
    });
  }, [isPlaying, isInsertClip, playbackRate, hasSeparatedTracks]);

  if (!hasSeparatedTracks) return null;

  return (
    <>
      <audio
        ref={vocalsRef}
        src={sourceResources?.audioVocals}
        preload="auto"
        crossOrigin="anonymous"
      />
      <audio
        ref={backingRef}
        src={sourceResources?.audioBacking}
        preload="auto"
        crossOrigin="anonymous"
      />
    </>
  );
});