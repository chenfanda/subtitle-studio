import type { SoundEffectCategory, AudioTrack } from '@/types/audio';

export const SFX_CATEGORIES: { id: SoundEffectCategory; name: string }[] = [
  { id: 'whoosh', name: '划过' },
  { id: 'click', name: '点击' },
  { id: 'transitions', name: '转场' },
  { id: 'ambientSfx', name: '环境' },
  { id: 'ui', name: 'UI音效' },
  { id: 'customSfx', name: '自定义' } 
];

export const SFX_LIBRARY: Record<SoundEffectCategory, AudioTrack[]> = {
  whoosh: [
    {
      id: 'sfx-whoosh-fast',
      name: '快速划过',
      category: 'whoosh',
      url: '/audio/sfx/whoosh-fast.mp3',
      duration: 2,
      volume: 0.8,
      fadeIn: 0,
      fadeOut: 0
    },
    {
      id: 'sfx-whoosh-deep',
      name: '低沉划过',
      category: 'whoosh',
      url: '/audio/sfx/whoosh-deep.mp3',
      duration: 3,
      volume: 0.8,
      fadeIn: 0,
      fadeOut: 0
    }
  ],

  click: [
    {
      id: 'sfx-click-sharp',
      name: '清脆点击',
      category: 'click',
      url: '/audio/sfx/click-sharp.mp3',
      duration: 1,
      volume: 0.7,
      fadeIn: 0,
      fadeOut: 0
    }
  ],

  transitions: [
    {
      id: 'sfx-transition-rise',
      name: '上升转场',
      category: 'transitions',
      url: '/audio/sfx/transition-rise.mp3',
      duration: 5,
      volume: 0.9,
      fadeIn: 0.5,
      fadeOut: 0
    }
  ],

  ambientSfx: [
    {
      id: 'sfx-ambient-birds',
      name: '鸟叫声',
      category: 'ambientSfx',
      url: '/audio/sfx/ambient-birds.mp3',
      duration: 15,
      volume: 0.5,
      fadeIn: 1,
      fadeOut: 1
    }
  ],

  ui: [
    {
      id: 'sfx-ui-notify',
      name: '通知音',
      category: 'ui',
      url: '/audio/sfx/ui-notify.mp3',
      duration: 1,
      volume: 0.6,
      fadeIn: 0,
      fadeOut: 0
    }
  ],

  customSfx: [] 
};