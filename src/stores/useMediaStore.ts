import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { MediaItem, PlacedMediaItem, UploadedMediaItem } from '@/types/media';
import { searchStickers, searchGifs, getTrendingStickers, getTrendingGifs } from '@/utils/giphyApi';
import { useProjectStore } from './useProjectStore';
import { useHistoryStore } from './useHistoryStore';


interface SearchState {
  query: string;
  isLoading: boolean;
  hasMore: boolean;
  offset: number;
}

interface MediaStore {
  searchState: SearchState;
  searchResults: MediaItem[];
  trendingItems: MediaItem[];
  searchHistory: string[];
  
  
  selectedMedia: MediaItem | null;
  activeMediaType: 'sticker' | 'gif';
  
  placedMedia: PlacedMediaItem[];
  uploadedMedia: UploadedMediaItem[];
  presetMedia: MediaItem[];
  loadPresets: () => Promise<void>;

  searchMedia: (query: string, type: 'sticker' | 'gif') => Promise<void>;
  loadMoreResults: () => Promise<void>;
  loadTrending: (type: 'sticker' | 'gif') => Promise<void>;
  clearSearch: () => void;
  
  selectMedia: (media: MediaItem) => void;
  clearSelection: () => void;
  setActiveMediaType: (type: 'sticker' | 'gif') => void;
  
  addUploadedMedia: (media: UploadedMediaItem) => void;
  removeUploadedMedia: (id: string) => void;
  getUploadedMedia: () => UploadedMediaItem[];
  
  placeOnTimeline: (media: MediaItem, startTime: number, endTime: number, x?: number, y?: number) => void;
  updateMediaPosition: (mediaId: string, x: number, y: number, scaleX?: number, scaleY?: number, rotation?: number, width?: number) => void;
  updateMediaTiming: (mediaId: string, startTime: number, endTime: number) => void;
  removeMedia: (mediaId: string) => void;
  
  restorePlacedMedia: (media: PlacedMediaItem[]) => void;
  
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  getMediaAtTime: (time: number) => PlacedMediaItem[];
}

export const useMediaStore = create<MediaStore>()(
  immer((set, get) => ({
    searchState: {
      query: '',
      isLoading: false,
      hasMore: true,
      offset: 0
    },
    searchResults: [],
    trendingItems: [],
    searchHistory: [],
    
    selectedMedia: null,
    activeMediaType: 'sticker',
    placedMedia: [],
    uploadedMedia: [],
    presetMedia: [],
    loadPresets: async () => {
      try {
        // 检查 electronAPI 是否已通过 preload.cjs 暴露
        if ((window as any).electronAPI?.getPresetMedia) {
          const items = await (window as any).electronAPI.getPresetMedia();
          set((state) => {
            state.presetMedia = items;
          });
        }
      } catch (error) {
        console.error('Failed to load preset media:', error);
      }
    },
    
    searchMedia: async (query, type) => {
      if (!query.trim()) return;
      
      set((state) => {
        state.searchState.query = query;
        state.searchState.isLoading = true;
        state.searchState.offset = 0;
        state.searchState.hasMore = true;
        state.searchResults = [];
        state.activeMediaType = type;
      });
      
      try {
        const searchFn = type === 'sticker' ? searchStickers : searchGifs;
        const result = await searchFn({ q: query, limit: 25, offset: 0 });
        
        set((state) => {
          state.searchResults = result.items;
          state.searchState.isLoading = false;
          state.searchState.hasMore = result.items.length === 25;
          state.searchState.offset = 25;
        });
        
        get().addToHistory(query);
        
      } catch (error) {
        console.error('Search failed:', error);
        set((state) => {
          state.searchState.isLoading = false;
        });
      }
    },
    
    loadMoreResults: async () => {
      const { searchState, activeMediaType } = get();
      if (searchState.isLoading || !searchState.hasMore || !searchState.query) return;
      
      set((state) => {
        state.searchState.isLoading = true;
      });
      
      try {
        const searchFn = activeMediaType === 'sticker' ? searchStickers : searchGifs;
        const result = await searchFn({ 
          q: searchState.query, 
          limit: 25, 
          offset: searchState.offset 
        });
        
        set((state) => {
          state.searchResults.push(...result.items);
          state.searchState.isLoading = false;
          state.searchState.hasMore = result.items.length === 25;
          state.searchState.offset += 25;
        });
        
      } catch (error) {
        console.error('Load more failed:', error);
        set((state) => {
          state.searchState.isLoading = false;
        });
      }
    },
    
    loadTrending: async (type) => {
      try {
        const trendingFn = type === 'sticker' ? getTrendingStickers : getTrendingGifs;
        const items = await trendingFn(20);
        
        set((state) => {
          state.trendingItems = items;
          state.activeMediaType = type;
        });
        
      } catch (error) {
        console.error('Load trending failed:', error);
      }
    },
    
    clearSearch: () => 
      set((state) => {
        state.searchState.query = '';
        state.searchState.offset = 0;
        state.searchState.hasMore = true;
        state.searchResults = [];
      }),
    
    selectMedia: (media) => 
      set((state) => {
        state.selectedMedia = media;
      }),
    
    clearSelection: () => 
      set((state) => {
        state.selectedMedia = null;
      }),
    
    setActiveMediaType: (type) => 
      set((state) => {
        state.activeMediaType = type;
        state.selectedMedia = null;
      }),
    
    addUploadedMedia: (media) =>
      set((state) => {
        state.uploadedMedia.push(media);
      }),
    
    removeUploadedMedia: (id) =>
      set((state) => {
        state.uploadedMedia = state.uploadedMedia.filter(item => item.id !== id);
      }),
    
    getUploadedMedia: () => {
      return get().uploadedMedia;
    },
    
    placeOnTimeline: (media, startTime, endTime, x = 50, y = 50) => {
      const placement: PlacedMediaItem = {
        media,
        position: {
          x,
          y,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          startTime,
          endTime
        }
      };
      
      set((state) => {
        state.placedMedia.push(placement);
      });
      
      useProjectStore.getState().markUnsaved();
      useHistoryStore.getState().pushState();
    },
    
    updateMediaPosition: (mediaId, x, y, scaleX, scaleY, rotation, width) =>
          set((state) => {
            const media = state.placedMedia.find(item => item.media.id === mediaId);
            if (media) {
              media.position.x = x;
              media.position.y = y;
              if (scaleX !== undefined) media.position.scaleX = scaleX;
              if (scaleY !== undefined) media.position.scaleY = scaleY;
              if (rotation !== undefined) media.position.rotation = rotation;
              if (width !== undefined) media.position.width = width;
            }
          }),
    
    updateMediaTiming: (mediaId, startTime, endTime) => {
      set((state) => {
        const media = state.placedMedia.find(item => item.media.id === mediaId);
        if (media) {
          media.position.startTime = startTime;
          media.position.endTime = endTime;
        }
      });
      
      useProjectStore.getState().markUnsaved();
      useHistoryStore.getState().pushState();
    },
    
    removeMedia: (mediaId) => {
      set((state) => {
        state.placedMedia = state.placedMedia.filter(item => item.media.id !== mediaId);
      });
      
      useProjectStore.getState().markUnsaved();
      useHistoryStore.getState().pushState();
    },
    
    restorePlacedMedia: (media) =>
      set((state) => {
        state.placedMedia = media || [];
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
    
    getMediaAtTime: (time) => {
      const { placedMedia } = get();
      return placedMedia.filter(item => 
        time >= item.position.startTime && time <= item.position.endTime
      );
    },
  }))
);

export const useSearchState = () => 
  useMediaStore((state) => state.searchState);

export const useSearchResults = () => 
  useMediaStore((state) => state.searchResults);

export const useTrendingItems = () => 
  useMediaStore((state) => state.trendingItems);

export const useSelectedMedia = () => 
  useMediaStore((state) => state.selectedMedia);

export const useActiveMediaType = () => 
  useMediaStore((state) => state.activeMediaType);

export const usePlacedMedia = () => 
  useMediaStore((state) => state.placedMedia);

export const useUploadedMedia = () => 
  useMediaStore((state) => state.uploadedMedia);

export const useSearchHistory = () => 
  useMediaStore((state) => state.searchHistory);