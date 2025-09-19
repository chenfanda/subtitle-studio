import type { AudioCategory, AudioTrack } from '@/types/audio';

export const AUDIO_CATEGORIES: { id: AudioCategory; name: string }[] = [
  { id: 'like', name: 'Like' },
  { id: 'epic', name: 'Epic' },
  { id: 'ambient', name: 'Ambient' },
  { id: 'acoustic', name: 'Acoustic' },
  { id: 'electronic', name: 'Electronic' },
  { id: 'hipHop', name: 'Hip Hop' }
];

export const AUDIO_LIBRARY: Record<AudioCategory, AudioTrack[]> = {
  like: [
    {
      id: 'crimson-dawn',
      name: 'Crimson Dawn',
      category: 'like',
      url: '/audio/like/crimson-dawn.mp3',
      duration: 180,
      volume: 0.7,
      fadeIn: 2,
      fadeOut: 3
    },
    {
      id: 'valiant-rise',
      name: 'Valiant Rise',
      category: 'like',
      url: '/audio/like/valiant-rise.mp3',
      duration: 165,
      volume: 0.8,
      fadeIn: 1.5,
      fadeOut: 2.5
    }
  ],

  epic: [
    {
      id: 'titans-battle',
      name: "Titan's Battle",
      category: 'epic',
      url: '/audio/epic/titans-battle.mp3',
      duration: 220,
      volume: 0.9,
      fadeIn: 3,
      fadeOut: 4
    },
    {
      id: 'skyward-call',
      name: 'Skyward Call',
      category: 'epic',
      url: '/audio/epic/skyward-call.mp3',
      duration: 195,
      volume: 0.85,
      fadeIn: 2.5,
      fadeOut: 3.5
    }
  ],

  ambient: [
    {
      id: 'stormforged',
      name: 'Stormforged',
      category: 'ambient',
      url: '/audio/ambient/stormforged.mp3',
      duration: 240,
      volume: 0.6,
      fadeIn: 4,
      fadeOut: 5
    },
    {
      id: 'eternal-honor',
      name: 'Eternal Honor',
      category: 'ambient',
      url: '/audio/ambient/eternal-honor.mp3',
      duration: 210,
      volume: 0.65,
      fadeIn: 3.5,
      fadeOut: 4.5
    }
  ],

  acoustic: [
    {
      id: 'dragons-ascent',
      name: "Dragon's Ascent",
      category: 'acoustic',
      url: '/audio/acoustic/dragons-ascent.mp3',
      duration: 175,
      volume: 0.75,
      fadeIn: 2,
      fadeOut: 3
    },
    {
      id: 'iron-citadel',
      name: 'Iron Citadel',
      category: 'acoustic',
      url: '/audio/acoustic/iron-citadel.mp3',
      duration: 160,
      volume: 0.8,
      fadeIn: 1.8,
      fadeOut: 2.8
    }
  ],

  electronic: [
    {
      id: 'clash-thrones',
      name: 'Clash of Thrones',
      category: 'electronic',
      url: '/audio/electronic/clash-thrones.mp3',
      duration: 200,
      volume: 0.85,
      fadeIn: 2.5,
      fadeOut: 3
    },
    {
      id: 'legacy-awaits',
      name: 'Legacy Awaits',
      category: 'electronic',
      url: '/audio/electronic/legacy-awaits.mp3',
      duration: 185,
      volume: 0.9,
      fadeIn: 2,
      fadeOut: 2.5
    }
  ],

  hipHop: []
};