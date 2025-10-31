export type AudioCategory = 'like' | 'epic' | 'ambient' | 'acoustic' | 'electronic' | 'hipHop' | 'custom';

export type SoundEffectCategory = 'whoosh' | 'click' | 'transitions' | 'ambientSfx' | 'ui' | 'customSfx';

export interface AudioTrack {
  id: string;
  name: string;
  category: AudioCategory | SoundEffectCategory;
  url: string;
  duration: number;
  thumbnail?: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

export interface AudioState {
  isPlaying: boolean;
  currentTrack: AudioTrack | null;
  volume: number;
  currentTime: number;
}