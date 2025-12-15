import type { AudioMix } from '@/types/project'; 
import type { SubtitleItem } from '@/types/subtitle';

export function calculateVolumeAtTime(
  currentTime: number,
  subtitles: SubtitleItem[],
  masterVolume: number,
  hasSeparatedTracks: boolean,
  globalAudioMix: AudioMix
) {
  const masterGain = masterVolume / 100;
  const currentTimeMs = currentTime * 1000;

  if (!hasSeparatedTracks) {
    return {
      mainVideo: masterGain * (globalAudioMix?.mainVideoVolume ?? 1), 
      vocals: 0,
      backing: 0,
    };
  }

  const activeSubtitle = subtitles.find(
    (sub) => currentTimeMs >= sub.startTime && currentTimeMs < sub.endTime
  );

  if (activeSubtitle) {

    if (activeSubtitle.sourceMix) {
      const { originalVocalVolume = 1, backingVolume = 1 } = activeSubtitle.sourceMix;
      return {
        mainVideo: 0,
        vocals: masterGain * originalVocalVolume,
        backing: masterGain * backingVolume,
      };
    }

    if (!!activeSubtitle.audioTrack) {
      return {
        mainVideo: 0,
        vocals: 0, 
        backing: masterGain * 1, 
      };
    }
  }


  const { originalVocalVolume = 1, backingVolume = 1 } = globalAudioMix || {};
  return {
    mainVideo: 0,
    vocals: masterGain * originalVocalVolume,
    backing: masterGain * backingVolume,
  };
}

