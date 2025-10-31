import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useMemo } from 'react';
import type { AudioCategory, AudioTrack, AudioState, SoundEffectCategory } from '@/types/audio';
import { AUDIO_LIBRARY } from '@/constants/audioCategories';
import { SFX_LIBRARY } from '@/constants/sfxCategories';
import { useSubtitleStore } from './useSubtitleStore';
import { useHistoryStore } from './useHistoryStore';
import { useProjectStore } from './useProjectStore';

export type AudioTaskType = 'voiceover' | 'bgm' | 'sfx';

interface AudioStore extends AudioState {
  activeAudioTask: AudioTaskType;
  activeCategory: AudioCategory;
  activeSfxCategory: SoundEffectCategory;
  selectedTrack: AudioTrack | null;
  backgroundMusic: AudioTrack | null;
  uploadedTracks: AudioTrack[];

  setActiveAudioTask: (task: AudioTaskType) => void;
  setActiveCategory: (category: AudioCategory) => void;
  setActiveSfxCategory: (category: SoundEffectCategory) => void;
  selectTrack: (track: AudioTrack) => void;
  clearSelection: () => void;

  playAudio: (track: AudioTrack) => void;
  pauseAudio: () => void;
  stopAudio: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;

  setBackgroundMusic: (track: AudioTrack) => void;
  removeBackgroundMusic: () => void;
  adjustBackgroundVolume: (volume: number) => void;
  restoreBackgroundMusic: (music: AudioTrack | null) => void;

  applyToSubtitle: (subtitleId: string) => void;

  uploadAudio: (file: File) => Promise<void>;
  deleteUploadedTrack: (trackId: string) => void;
}

export const useAudioStore = create<AudioStore>()(
  immer((set, get) => ({
    activeAudioTask: 'bgm',
    activeCategory: 'like',
    activeSfxCategory: 'whoosh',

    selectedTrack: null,
    backgroundMusic: null,
    uploadedTracks: [],

    isPlaying: false,
    currentTrack: null,
    volume: 80,
    currentTime: 0,

    setActiveAudioTask: (task) =>
      set((state) => {
        state.activeAudioTask = task;
        state.selectedTrack = null;
      }),

    setActiveCategory: (category) => 
      set((state) => {
        state.activeCategory = category;
        state.selectedTrack = null;
      }),

    setActiveSfxCategory: (category) =>
      set((state) => {
        state.activeSfxCategory = category;
        state.selectedTrack = null;
      }),

    selectTrack: (track) => 
      set((state) => {
        state.selectedTrack = track;
      }),

    clearSelection: () => 
      set((state) => {
        state.selectedTrack = null;
      }),

    playAudio: (track) => 
      set((state) => {
        state.currentTrack = track;
        state.isPlaying = true;
        state.currentTime = 0;
        state.volume = track.volume * 100;
      }),

    pauseAudio: () => 
      set((state) => {
        state.isPlaying = false;
      }),

    stopAudio: () => 
      set((state) => {
        state.isPlaying = false;
        state.currentTrack = null;
        state.currentTime = 0;
      }),

    setVolume: (volume) => 
      set((state) => {
        state.volume = Math.max(0, Math.min(100, volume));
      }),

    setCurrentTime: (time) => 
      set((state) => {
        if (state.currentTrack) {
          state.currentTime = Math.max(0, Math.min(time, state.currentTrack.duration));
        }
      }),

    setBackgroundMusic: (track) => {
      set((state) => {
        state.backgroundMusic = {
          ...track,
          volume: track.volume
        };
      });
      useProjectStore.getState().markUnsaved();
      useHistoryStore.getState().pushState();
    },

    removeBackgroundMusic: () => {
      set((state) => {
        state.backgroundMusic = null;
      });
      useProjectStore.getState().markUnsaved();
      useHistoryStore.getState().pushState();
    },

    adjustBackgroundVolume: (volume) => {
      set((state) => {
        if (state.backgroundMusic) {
          state.backgroundMusic.volume = Math.max(0, Math.min(1, volume));
        }
      });
      useProjectStore.getState().markUnsaved();
      useHistoryStore.getState().pushState();
    },

    restoreBackgroundMusic: (music) =>
      set((state) => {
        state.backgroundMusic = music;
      }),

    applyToSubtitle: (subtitleId) => {
      const { selectedTrack, activeAudioTask } = get();
      if (!selectedTrack) return;

      const subtitleStore = useSubtitleStore.getState();

      if (activeAudioTask === 'sfx') {
        subtitleStore.setSubtitleSoundEffect(subtitleId, {
          track: selectedTrack,
          volume: selectedTrack.volume || 0.7,
        });
      } else {
        subtitleStore.setSubtitleAudio(subtitleId, {
          track: selectedTrack,
          volume: 70,
          fadeIn: 1,
          fadeOut: 1
        });
      }

      get().clearSelection();
    },

    uploadAudio: async (file) => {
      try {
        const audio = new Audio();
        const url = URL.createObjectURL(file);

        return new Promise((resolve, reject) => {
          audio.onloadedmetadata = () => {
            const { activeAudioTask, activeCategory, activeSfxCategory } = get();

            const category = activeAudioTask === 'sfx' ? activeSfxCategory : activeCategory;

            const newTrack: AudioTrack = {
              id: `uploaded_${Date.now()}`,
              name: file.name.replace(/\.[^/.]+$/, ""),
              category: category,
              url,
              duration: Math.floor(audio.duration),
              volume: 0.7,
              fadeIn: 1,
              fadeOut: 1
            };

            set((state) => {
              state.uploadedTracks.push(newTrack);
              state.selectedTrack = newTrack;
            });

            resolve();
          };

          audio.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load audio file'));
          };

          audio.src = url;
        });
      } catch (error) {
        console.error('Audio upload failed:', error);
        throw error;
      }
    },

 deleteUploadedTrack: (trackId) => 
  set((state) => {
    const trackToDelete = state.uploadedTracks.find(track => track.id === trackId);
    if (trackToDelete && trackToDelete.url.startsWith('blob:')) {
      URL.revokeObjectURL(trackToDelete.url);
    }

    state.uploadedTracks = state.uploadedTracks.filter(track => track.id !== trackId);

    if (state.selectedTrack?.id === trackId) {
      state.selectedTrack = null;
    }

    if (state.backgroundMusic?.id === trackId) {
      state.backgroundMusic = null;
    }

    if (state.currentTrack?.id === trackId) {
      state.isPlaying = false;
      state.currentTrack = null;
      state.currentTime = 0;
    }
  }),
  }))
);

export const useActiveAudioTask = () =>
  useAudioStore((state) => state.activeAudioTask);

export const useActiveCategory = () => 
  useAudioStore((state) => state.activeCategory);

export const useActiveSfxCategory = () =>
  useAudioStore((state) => state.activeSfxCategory);

export const useSelectedTrack = () => 
  useAudioStore((state) => state.selectedTrack);

export const useBackgroundMusic = () => 
  useAudioStore((state) => state.backgroundMusic);

export const useAudioPlayState = () => 
  useAudioStore((state) => ({
    isPlaying: state.isPlaying,
    currentTrack: state.currentTrack,
    volume: state.volume,
    currentTime: state.currentTime
  }));

export const useTracksForActiveTask = () => {
  const activeAudioTask = useAudioStore((state) => state.activeAudioTask);
  const activeCategory = useAudioStore((state) => state.activeCategory);
  const activeSfxCategory = useAudioStore((state) => state.activeSfxCategory);
  const uploadedTracks = useAudioStore((state) => state.uploadedTracks);

  const tracks = useMemo(() => {
    if (activeAudioTask === 'bgm') {
      const libraryTracks = AUDIO_LIBRARY[activeCategory] || [];
      const userTracks = uploadedTracks.filter(track => track.category === activeCategory);
      return [...libraryTracks, ...userTracks];
    } 

    if (activeAudioTask === 'sfx') {
      const libraryTracks = SFX_LIBRARY[activeSfxCategory] || [];
      const userTracks = uploadedTracks.filter(track => track.category === activeSfxCategory);
      return [...libraryTracks, ...userTracks];
    }
    return [];
  }, [activeAudioTask, activeCategory, activeSfxCategory, uploadedTracks]);

  return tracks;
};