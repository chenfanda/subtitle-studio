import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { BrollVideo, BrollRecommendation, BrollPlacement, BrollTransition } from '@/types/broll';
import type { SubtitleItem } from '@/types/subtitle';
import { 
  searchBrollVideos, 
  createBrollPlacement, 
  optimizeBrollForSubtitle,
  filterBrollByDuration 
} from '@/utils/brollUtils';
import { useProjectStore } from './useProjectStore';
import { useSubtitleStore } from './useSubtitleStore';

interface SearchState {
  query: string;
  isLoading: boolean;
  results: BrollVideo[];
}

interface BrollStore {
  searchState: SearchState;
  searchHistory: string[];
  
  selectedBroll: BrollVideo | null;
  selectedSubtitle: SubtitleItem | null;
  
  selectedVideo: BrollVideo | null;
  selectedTransition: BrollTransition;
  dialogView: 'search' | 'edit';
  
  placedBrolls: BrollPlacement[];
  
  recommendations: BrollRecommendation[];
  
  searchBroll: (query: string) => Promise<void>;
  clearSearch: () => void;
  
  selectBroll: (broll: BrollVideo) => void;
  selectSubtitle: (subtitle: SubtitleItem) => void;
  clearSelection: () => void;
  
  selectVideo: (video: BrollVideo) => void;
  selectTransition: (transition: BrollTransition) => void;
  setDialogView: (view: 'search' | 'edit') => void;
  applyToSubtitle: (subtitleId: string) => void;
  resetDialog: () => void;
  
  placeOnTimeline: (startTime: number, endTime: number) => void;
  placeBesideSubtitle: (subtitleId: string, paddingBefore?: number, paddingAfter?: number) => void;
  updateBrollTiming: (brollId: string, startTime: number, endTime: number) => void;
  updateBrollVolume: (brollId: string, volume: number) => void;
  removeBroll: (brollId: string) => void;
  
  restorePlacedBrolls: (brolls: BrollPlacement[]) => void;
  
  filterBrollsByDuration: (minDuration: number, maxDuration: number) => BrollVideo[];
  optimizeBrollForCurrentSubtitle: () => BrollPlacement | null;
  
  generateBasicRecommendations: (subtitles: SubtitleItem[]) => void;
  clearRecommendations: () => void;
  
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  getBrollAtTime: (time: number) => BrollPlacement[];
}

export const useBrollStore = create<BrollStore>()(
  immer((set, get) => ({
    searchState: {
      query: '',
      isLoading: false,
      results: []
    },
    searchHistory: [],
    
    selectedBroll: null,
    selectedSubtitle: null,
    
    selectedVideo: null,
    selectedTransition: 'none',
    dialogView: 'search',
    
    placedBrolls: [],
    recommendations: [],
    
    searchBroll: async (query) => {
      if (!query.trim()) return;
      
      set((state) => {
        state.searchState.query = query;
        state.searchState.isLoading = true;
        state.searchState.results = [];
      });
      
      try {
        const results = await searchBrollVideos(query, 20);
        
        set((state) => {
          state.searchState.results = results;
          state.searchState.isLoading = false;
        });
        
        get().addToHistory(query);
        
      } catch (error) {
        console.error('B-roll search failed:', error);
        set((state) => {
          state.searchState.isLoading = false;
        });
      }
    },
    
    clearSearch: () => 
      set((state) => {
        state.searchState.query = '';
        state.searchState.results = [];
      }),
    
    selectBroll: (broll) => 
      set((state) => {
        state.selectedBroll = broll;
      }),
    
    selectSubtitle: (subtitle) => 
      set((state) => {
        state.selectedSubtitle = subtitle;
      }),
    
    clearSelection: () => 
      set((state) => {
        state.selectedBroll = null;
        state.selectedSubtitle = null;
      }),
    
    selectVideo: (video) => 
      set((state) => {
        state.selectedVideo = video;
        state.dialogView = 'edit';
      }),
    
    selectTransition: (transition) => 
      set((state) => {
        state.selectedTransition = transition;
      }),
    
    setDialogView: (view) => 
      set((state) => {
        state.dialogView = view;
      }),
    
    applyToSubtitle: (subtitleId) => {
      const { selectedVideo, selectedTransition } = get();
      if (!selectedVideo) return;
      
      const subtitleStore = useSubtitleStore.getState();
      subtitleStore.setSubtitleBroll(subtitleId, {
        video: selectedVideo,
        volume: 50,
        startOffset: 0,
        transition: selectedTransition
      });
      
      get().resetDialog();
    },
    
    resetDialog: () => 
      set((state) => {
        state.selectedVideo = null;
        state.selectedTransition = 'none';
        state.dialogView = 'search';
      }),
    
    placeOnTimeline: (startTime, endTime) => {
      const { selectedBroll } = get();
      if (!selectedBroll) return;
      
      const placement = createBrollPlacement(
        selectedBroll,
        startTime,
        endTime - startTime,
        0.3
      );
      
      set((state) => {
        state.placedBrolls.push(placement);
      });
      
      useProjectStore.getState().markUnsaved();
    },
    
    placeBesideSubtitle: (subtitleId, paddingBefore = 500, paddingAfter = 500) => {
      const { selectedBroll } = get();
      if (!selectedBroll) return;
      
      const subtitleStore = useSubtitleStore.getState();
      const subtitle = subtitleStore.subtitles.find(s => s.id === subtitleId);
      if (!subtitle) return;
      
      const placement = optimizeBrollForSubtitle(
        selectedBroll,
        subtitle,
        paddingBefore,
        paddingAfter
      );
      
      set((state) => {
        state.placedBrolls.push(placement);
      });
      
      useProjectStore.getState().markUnsaved();
    },
    
    updateBrollTiming: (brollId, startTime, endTime) => 
      set((state) => {
        const broll = state.placedBrolls.find(item => item.brollVideo.id === brollId);
        if (broll) {
          broll.startTime = startTime;
          broll.endTime = endTime;
        }
      }),
    
    updateBrollVolume: (brollId, volume) => 
      set((state) => {
        const broll = state.placedBrolls.find(item => item.brollVideo.id === brollId);
        if (broll) {
          broll.volume = Math.max(0, Math.min(1, volume));
        }
      }),
    
    removeBroll: (brollId) => 
      set((state) => {
        state.placedBrolls = state.placedBrolls.filter(item => item.brollVideo.id !== brollId);
      }),
    
    restorePlacedBrolls: (brolls) =>
      set((state) => {
        state.placedBrolls = brolls || [];
      }),
    
    filterBrollsByDuration: (minDuration, maxDuration) => {
      const { searchState } = get();
      return filterBrollByDuration(searchState.results, minDuration, maxDuration);
    },
    
    optimizeBrollForCurrentSubtitle: () => {
      const { selectedBroll, selectedSubtitle } = get();
      if (!selectedBroll || !selectedSubtitle) return null;
      
      return optimizeBrollForSubtitle(selectedBroll, selectedSubtitle);
    },
    
    generateBasicRecommendations: (subtitles) => {
      const recommendations: BrollRecommendation[] = subtitles.map(subtitle => ({
        subtitleId: subtitle.id,
        keywords: subtitle.text.split(' ').slice(0, 3),
        suggestions: []
      }));
      
      set((state) => {
        state.recommendations = recommendations;
      });
    },
    
    clearRecommendations: () => 
      set((state) => {
        state.recommendations = [];
      }),
    
    addToHistory: (query) => 
      set((state) => {
        const trimmed = query.trim();
        if (trimmed && !state.searchHistory.includes(trimmed)) {
          state.searchHistory.unshift(trimmed);
          if (state.searchHistory.length > 10) {
            state.searchHistory = state.searchHistory.slice(0, 10);
          }
        }
      }),
    
    clearHistory: () => 
      set((state) => {
        state.searchHistory = [];
      }),
    
    getBrollAtTime: (time) => {
      const { placedBrolls } = get();
      return placedBrolls.filter(item => 
        time >= item.startTime && time <= item.endTime
      );
    },
  }))
);

export const useSearchState = () => 
  useBrollStore((state) => state.searchState);

export const useSelectedBroll = () => 
  useBrollStore((state) => state.selectedBroll);

export const useSelectedSubtitle = () => 
  useBrollStore((state) => state.selectedSubtitle);

export const useSelectedVideo = () => 
  useBrollStore((state) => state.selectedVideo);

export const useSelectedTransition = () => 
  useBrollStore((state) => state.selectedTransition);

export const useDialogView = () => 
  useBrollStore((state) => state.dialogView);

export const usePlacedBrolls = () => 
  useBrollStore((state) => state.placedBrolls);

export const useBrollRecommendations = () => 
  useBrollStore((state) => state.recommendations);

export const useSearchHistory = () => 
  useBrollStore((state) => state.searchHistory);