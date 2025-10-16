import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AudioCategory, AudioTrack, AudioState } from '@/types/audio';
import { AUDIO_LIBRARY } from '@/constants/audioCategories';
import { useProjectStore } from './useProjectStore';

interface AudioStore extends AudioState {
  activeCategory: AudioCategory;
  selectedTrack: AudioTrack | null;
  backgroundMusic: AudioTrack | null;
  uploadedTracks: AudioTrack[];
  
  setActiveCategory: (category: AudioCategory) => void;
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
  
  getTracksByCategory: (category: AudioCategory) => AudioTrack[];
  uploadAudio: (file: File) => Promise<void>;
  deleteUploadedTrack: (trackId: string) => void;
}

export const useAudioStore = create<AudioStore>()(
  immer((set, get) => ({
    activeCategory: 'like',
    selectedTrack: null,
    backgroundMusic: null,
    uploadedTracks: [],
    
    isPlaying: false,
    currentTrack: null,
    volume: 80,
    currentTime: 0,
    
    setActiveCategory: (category) => 
      set((state) => {
        state.activeCategory = category;
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
    
    setBackgroundMusic: (track) => 
      set((state) => {
        state.backgroundMusic = {
          ...track,
          volume: track.volume
        };
      }),
    
    removeBackgroundMusic: () => 
      set((state) => {
        state.backgroundMusic = null;
      }),
    
    adjustBackgroundVolume: (volume) => 
      set((state) => {
        if (state.backgroundMusic) {
          state.backgroundMusic.volume = Math.max(0, Math.min(1, volume));
        }
      }),
    
    restoreBackgroundMusic: (music) =>
      set((state) => {
        state.backgroundMusic = music;
      }),
    
    applyToSubtitle: (subtitleId) => {
      const { selectedTrack } = get();
      if (!selectedTrack) return;
      
      const projectStore = useProjectStore.getState();
      projectStore.setSubtitleAudio(subtitleId, {
        track: selectedTrack,
        volume: 70,
        fadeIn: 1,
        fadeOut: 1
      });
      
      get().clearSelection();
    },
    
    getTracksByCategory: (category) => {
      const libraryTracks = AUDIO_LIBRARY[category] || [];
      const { uploadedTracks } = get();
      
      const userTracksInCategory = uploadedTracks.filter(track => track.category === category);
      return [...libraryTracks, ...userTracksInCategory];
    },
    
    uploadAudio: async (file) => {
      try {
        const audio = new Audio();
        const url = URL.createObjectURL(file);
        
        return new Promise((resolve, reject) => {
          audio.onloadedmetadata = () => {
            const newTrack: AudioTrack = {
              id: `uploaded_${Date.now()}`,
              name: file.name.replace(/\.[^/.]+$/, ""),
              category: get().activeCategory,
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
            
            URL.revokeObjectURL(url);
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

export const useActiveCategory = () => 
  useAudioStore((state) => state.activeCategory);

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

export const useTracksByActiveCategory = () => {
  const activeCategory = useAudioStore((state) => state.activeCategory);
  const getTracksByCategory = useAudioStore((state) => state.getTracksByCategory);
  return getTracksByCategory(activeCategory);
};