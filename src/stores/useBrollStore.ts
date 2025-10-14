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

interface SearchState {
  query: string;
  isLoading: boolean;
  results: BrollVideo[];
}

interface BrollStore {
  // 搜索状态
  searchState: SearchState;
  searchHistory: string[];
  
  // 选择状态
  selectedBroll: BrollVideo | null;
  selectedSubtitle: SubtitleItem | null;
  
  // 🆕 弹窗状态
  selectedVideo: BrollVideo | null;
  selectedTransition: BrollTransition;
  dialogView: 'search' | 'edit';
  
  // 已放置的B-roll
  placedBrolls: BrollPlacement[];
  
  // 推荐状态（基础版，后续扩展AI功能）
  recommendations: BrollRecommendation[];
  
  // 搜索方法
  searchBroll: (query: string) => Promise<void>;
  clearSearch: () => void;
  
  // 选择方法
  selectBroll: (broll: BrollVideo) => void;
  selectSubtitle: (subtitle: SubtitleItem) => void;
  clearSelection: () => void;
  
  // 🆕 弹窗视图方法
  selectVideo: (video: BrollVideo) => void;
  selectTransition: (transition: BrollTransition) => void;
  setDialogView: (view: 'search' | 'edit') => void;
  applyToSubtitle: (subtitleId: string) => void;
  resetDialog: () => void;
  
  // B-roll放置方法
  placeOnTimeline: (startTime: number, endTime: number) => void;
  placeBesideSubtitle: (subtitleId: string, paddingBefore?: number, paddingAfter?: number) => void;
  updateBrollTiming: (brollId: string, startTime: number, endTime: number) => void;
  updateBrollVolume: (brollId: string, volume: number) => void;
  removeBroll: (brollId: string) => void;
  
  // 筛选和优化
  filterBrollsByDuration: (minDuration: number, maxDuration: number) => BrollVideo[];
  optimizeBrollForCurrentSubtitle: () => BrollPlacement | null;
  
  // 推荐方法（基础版）
  generateBasicRecommendations: (subtitles: SubtitleItem[]) => void;
  clearRecommendations: () => void;
  
  // 工具方法
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  getBrollAtTime: (time: number) => BrollPlacement[];
}

export const useBrollStore = create<BrollStore>()(
  immer((set, get) => ({
    // 初始状态
    searchState: {
      query: '',
      isLoading: false,
      results: []
    },
    searchHistory: [],
    
    selectedBroll: null,
    selectedSubtitle: null,
    
    // 🆕 弹窗状态初始值
    selectedVideo: null,
    selectedTransition: 'none',
    dialogView: 'search',
    
    placedBrolls: [],
    recommendations: [],
    
    // 搜索B-roll
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
    
    // 🆕 选择视频（弹窗中点击卡片）
    selectVideo: (video) => 
      set((state) => {
        state.selectedVideo = video;
        state.dialogView = 'edit'; // 自动切换到编辑视图
      }),
    
    // 🆕 选择过渡效果
    selectTransition: (transition) => 
      set((state) => {
        state.selectedTransition = transition;
      }),
    
    // 🆕 设置弹窗视图
    setDialogView: (view) => 
      set((state) => {
        state.dialogView = view;
      }),
    
    // 🆕 应用到字幕
    applyToSubtitle: (subtitleId) => {
      const { selectedVideo, selectedTransition } = get();
      if (!selectedVideo) return;
      
      const projectStore = useProjectStore.getState();
      projectStore.setSubtitleBroll(subtitleId, {
        video: selectedVideo,
        volume: 50,
        startOffset: 0,
        transition: selectedTransition
      });
      
      // 重置弹窗状态
      get().resetDialog();
    },
    
    // 🆕 重置弹窗状态
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
      
      const projectStore = useProjectStore.getState();
      const subtitle = projectStore.subtitles.find(s => s.id === subtitleId);
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
      
      projectStore.markUnsaved();
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

// 便捷选择器
export const useSearchState = () => 
  useBrollStore((state) => state.searchState);

export const useSelectedBroll = () => 
  useBrollStore((state) => state.selectedBroll);

export const useSelectedSubtitle = () => 
  useBrollStore((state) => state.selectedSubtitle);

// 🆕 弹窗状态选择器
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