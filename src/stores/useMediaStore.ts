import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { MediaItem, PlacedMediaItem } from '@/types/media';
import { searchStickers, searchGifs, getTrendingStickers, getTrendingGifs } from '@/utils/giphyApi';
import { createMediaPlacement } from '@/utils/mediaUtils';
import { useProjectStore } from './useProjectStore';

interface SearchState {
  query: string;
  isLoading: boolean;
  hasMore: boolean;
  offset: number;
}

interface MediaStore {
  // 搜索状态
  searchState: SearchState;
  searchResults: MediaItem[];
  trendingItems: MediaItem[];
  searchHistory: string[];
  
  // 选择状态
  selectedMedia: MediaItem | null;
  activeMediaType: 'sticker' | 'gif';
  
  // 已放置的媒体素材
  placedMedia: PlacedMediaItem[];
  
  // 搜索方法
  searchMedia: (query: string, type: 'sticker' | 'gif') => Promise<void>;
  loadMoreResults: () => Promise<void>;
  loadTrending: (type: 'sticker' | 'gif') => Promise<void>;
  clearSearch: () => void;
  
  // 选择方法
  selectMedia: (media: MediaItem) => void;
  clearSelection: () => void;
  setActiveMediaType: (type: 'sticker' | 'gif') => void;
  
  // 媒体放置方法
  placeOnTimeline: (startTime: number, endTime: number, x?: number, y?: number) => void;
  updateMediaPosition: (mediaId: string, x: number, y: number, scale?: number) => void;
  updateMediaTiming: (mediaId: string, startTime: number, endTime: number) => void;
  removeMedia: (mediaId: string) => void;
  
  // 工具方法
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  getMediaAtTime: (time: number) => PlacedMediaItem[];
}

export const useMediaStore = create<MediaStore>()(
  immer((set, get) => ({
    // 初始状态
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
    
    // 搜索媒体
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
        
        // 添加到搜索历史
        get().addToHistory(query);
        
      } catch (error) {
        console.error('Search failed:', error);
        set((state) => {
          state.searchState.isLoading = false;
        });
      }
    },
    
    // 加载更多结果
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
    
    // 加载热门内容
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
    
    // 清除搜索
    clearSearch: () => 
      set((state) => {
        state.searchState.query = '';
        state.searchState.offset = 0;
        state.searchState.hasMore = true;
        state.searchResults = [];
      }),
    
    // 选择媒体
    selectMedia: (media) => 
      set((state) => {
        state.selectedMedia = media;
      }),
    
    // 清除选择
    clearSelection: () => 
      set((state) => {
        state.selectedMedia = null;
      }),
    
    // 设置媒体类型
    setActiveMediaType: (type) => 
      set((state) => {
        state.activeMediaType = type;
        state.selectedMedia = null; // 切换类型时清除选择
      }),
    
    // 放置到时间轴
    placeOnTimeline: (startTime, endTime, x = 50, y = 50) => {
      const { selectedMedia } = get();
      if (!selectedMedia) return;
      
      const placement = createMediaPlacement(
        selectedMedia,
        startTime,
        endTime,
        x,
        y,
        1 // 默认缩放
      );
      
      set((state) => {
        state.placedMedia.push(placement);
      });
      
      // 通知项目Store有媒体变更
      useProjectStore.getState().markUnsaved();
    },
    
    // 更新媒体位置
    updateMediaPosition: (mediaId, x, y, scale) => 
      set((state) => {
        const media = state.placedMedia.find(item => item.media.id === mediaId);
        if (media) {
          media.position.x = x;
          media.position.y = y;
          if (scale !== undefined) {
            media.position.scale = scale;
          }
        }
      }),
    
    // 更新媒体时间
    updateMediaTiming: (mediaId, startTime, endTime) => 
      set((state) => {
        const media = state.placedMedia.find(item => item.media.id === mediaId);
        if (media) {
          media.position.startTime = startTime;
          media.position.endTime = endTime;
        }
      }),
    
    // 移除媒体
    removeMedia: (mediaId) => 
      set((state) => {
        state.placedMedia = state.placedMedia.filter(item => item.media.id !== mediaId);
      }),
    
    // 添加到搜索历史
    addToHistory: (query) => 
      set((state) => {
        const trimmed = query.trim();
        if (trimmed && !state.searchHistory.includes(trimmed)) {
          state.searchHistory.unshift(trimmed);
          // 保持历史记录最多10条
          if (state.searchHistory.length > 10) {
            state.searchHistory = state.searchHistory.slice(0, 10);
          }
        }
      }),
    
    // 清除搜索历史
    clearHistory: () => 
      set((state) => {
        state.searchHistory = [];
      }),
    
    // 获取指定时间的媒体
    getMediaAtTime: (time) => {
      const { placedMedia } = get();
      return placedMedia.filter(item => 
        time >= item.position.startTime && time <= item.position.endTime
      );
    },
  }))
);

// 便捷选择器
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

export const useSearchHistory = () => 
  useMediaStore((state) => state.searchHistory);