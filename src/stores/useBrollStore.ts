import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { BrollVideo, BrollRecommendation, BrollPlacement } from '@/types/broll';
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
        
        // 添加到搜索历史
        get().addToHistory(query);
        
      } catch (error) {
        console.error('B-roll search failed:', error);
        set((state) => {
          state.searchState.isLoading = false;
        });
      }
    },
    
    // 清除搜索
    clearSearch: () => 
      set((state) => {
        state.searchState.query = '';
        state.searchState.results = [];
      }),
    
    // 选择B-roll
    selectBroll: (broll) => 
      set((state) => {
        state.selectedBroll = broll;
      }),
    
    // 选择字幕（用于关联B-roll）
    selectSubtitle: (subtitle) => 
      set((state) => {
        state.selectedSubtitle = subtitle;
      }),
    
    // 清除选择
    clearSelection: () => 
      set((state) => {
        state.selectedBroll = null;
        state.selectedSubtitle = null;
      }),
    
    // 放置到时间轴
    placeOnTimeline: (startTime, endTime) => {
      const { selectedBroll } = get();
      if (!selectedBroll) return;
      
      const placement = createBrollPlacement(
        selectedBroll,
        startTime,
        endTime - startTime,
        0.3 // 默认音量
      );
      
      set((state) => {
        state.placedBrolls.push(placement);
      });
      
      // 通知项目Store有变更
      useProjectStore.getState().markUnsaved();
    },
    
    // 放置在字幕旁边
    placeBesideSubtitle: (subtitleId, paddingBefore = 500, paddingAfter = 500) => {
      const { selectedBroll } = get();
      if (!selectedBroll) return;
      
      // 从项目Store获取字幕信息
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
    
    // 更新B-roll时间
    updateBrollTiming: (brollId, startTime, endTime) => 
      set((state) => {
        const broll = state.placedBrolls.find(item => item.brollVideo.id === brollId);
        if (broll) {
          broll.startTime = startTime;
          broll.endTime = endTime;
        }
      }),
    
    // 更新B-roll音量
    updateBrollVolume: (brollId, volume) => 
      set((state) => {
        const broll = state.placedBrolls.find(item => item.brollVideo.id === brollId);
        if (broll) {
          broll.volume = Math.max(0, Math.min(1, volume));
        }
      }),
    
    // 移除B-roll
    removeBroll: (brollId) => 
      set((state) => {
        state.placedBrolls = state.placedBrolls.filter(item => item.brollVideo.id !== brollId);
      }),
    
    // 按时长筛选B-roll
    filterBrollsByDuration: (minDuration, maxDuration) => {
      const { searchState } = get();
      return filterBrollByDuration(searchState.results, minDuration, maxDuration);
    },
    
    // 为当前字幕优化B-roll
    optimizeBrollForCurrentSubtitle: () => {
      const { selectedBroll, selectedSubtitle } = get();
      if (!selectedBroll || !selectedSubtitle) return null;
      
      return optimizeBrollForSubtitle(selectedBroll, selectedSubtitle);
    },
    
    // 生成基础推荐（简单版本，基于关键词）
    generateBasicRecommendations: (subtitles) => {
      // 基础版本：为每个字幕生成简单的关键词推荐
      const recommendations: BrollRecommendation[] = subtitles.map(subtitle => ({
        subtitleId: subtitle.id,
        keywords: subtitle.text.split(' ').slice(0, 3), // 简单提取前3个词作为关键词
        suggestions: [] // 基础版暂时为空，后续通过AI服务填充
      }));
      
      set((state) => {
        state.recommendations = recommendations;
      });
    },
    
    // 清除推荐
    clearRecommendations: () => 
      set((state) => {
        state.recommendations = [];
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
    
    // 获取指定时间的B-roll
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

export const usePlacedBrolls = () => 
  useBrollStore((state) => state.placedBrolls);

export const useBrollRecommendations = () => 
  useBrollStore((state) => state.recommendations);

export const useSearchHistory = () => 
  useBrollStore((state) => state.searchHistory);