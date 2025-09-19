import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TimelineState, TrackItem } from '@/types/timeline';
import { APP_CONFIG } from '@/constants/config';

interface TimelineStore extends TimelineState {
  // 时间轴缩放和滚动
  setPixelsPerSecond: (pps: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToWindow: (duration: number, viewportWidth: number) => void;
  setScrollPosition: (position: number) => void;
  setViewportWidth: (width: number) => void;
  
  // 选择范围
  setSelectedRange: (start: number, end: number) => void;
  clearSelectedRange: () => void;
  expandSelectedRange: (time: number) => void;
  
  // 吸附功能
  setSnapEnabled: (enabled: boolean) => void;
  setSnapThreshold: (threshold: number) => void;
  findSnapTargets: (time: number) => number[];
  
  // 时间转换工具
  timeToPixel: (time: number) => number;
  pixelToTime: (pixel: number) => number;
  getVisibleTimeRange: () => { start: number; end: number };
  
  // 轨道管理
  tracks: TrackItem[];
  addTrackItem: (item: TrackItem) => void;
  removeTrackItem: (id: string) => void;
  updateTrackItem: (id: string, updates: Partial<TrackItem>) => void;
  
  // 重置
  resetTimeline: () => void;
}

const initialState: TimelineState = {
  pixelsPerSecond: APP_CONFIG.DEFAULT_PIXELS_PER_SECOND,
  scrollPosition: 0,
  viewportWidth: 800,
  selectedRange: null,
  snapEnabled: true,
  snapThreshold: 250, // 250ms
};

export const useTimelineStore = create<TimelineStore>()(
  immer((set, get) => ({
    ...initialState,
    tracks: [],
    
    // 缩放控制
    setPixelsPerSecond: (pps) => 
      set((state) => {
        state.pixelsPerSecond = Math.max(
          APP_CONFIG.MIN_PIXELS_PER_SECOND,
          Math.min(APP_CONFIG.MAX_PIXELS_PER_SECOND, pps)
        );
      }),
    
    zoomIn: () => 
      set((state) => {
        const newPps = state.pixelsPerSecond * 1.5;
        state.pixelsPerSecond = Math.min(APP_CONFIG.MAX_PIXELS_PER_SECOND, newPps);
      }),
    
    zoomOut: () => 
      set((state) => {
        const newPps = state.pixelsPerSecond / 1.5;
        state.pixelsPerSecond = Math.max(APP_CONFIG.MIN_PIXELS_PER_SECOND, newPps);
      }),
    
    fitToWindow: (duration, viewportWidth) => 
      set((state) => {
        if (duration > 0) {
          const pps = (viewportWidth - 100) / (duration / 1000); // 留出边距
          state.pixelsPerSecond = Math.max(
            APP_CONFIG.MIN_PIXELS_PER_SECOND,
            Math.min(APP_CONFIG.MAX_PIXELS_PER_SECOND, pps)
          );
          state.scrollPosition = 0;
        }
      }),
    
    setScrollPosition: (position) => 
      set((state) => {
        state.scrollPosition = Math.max(0, position);
      }),
    
    setViewportWidth: (width) => 
      set((state) => {
        state.viewportWidth = width;
      }),
    
    // 选择范围
    setSelectedRange: (start, end) => 
      set((state) => {
        state.selectedRange = { start: Math.min(start, end), end: Math.max(start, end) };
      }),
    
    clearSelectedRange: () => 
      set((state) => {
        state.selectedRange = null;
      }),
    
    expandSelectedRange: (time) => 
      set((state) => {
        if (!state.selectedRange) {
          state.selectedRange = { start: time, end: time };
        } else {
          state.selectedRange.start = Math.min(state.selectedRange.start, time);
          state.selectedRange.end = Math.max(state.selectedRange.end, time);
        }
      }),
    
    // 吸附功能
    setSnapEnabled: (enabled) => 
      set((state) => {
        state.snapEnabled = enabled;
      }),
    
    setSnapThreshold: (threshold) => 
      set((state) => {
        state.snapThreshold = threshold;
      }),
    
    findSnapTargets: (time) => {
      const { tracks, snapThreshold } = get();
      const targets: number[] = [];
      
      // 添加轨道项的开始和结束时间作为吸附目标
      tracks.forEach(track => {
        if (Math.abs(track.startTime - time) <= snapThreshold) {
          targets.push(track.startTime);
        }
        if (Math.abs(track.endTime - time) <= snapThreshold) {
          targets.push(track.endTime);
        }
      });
      
      // 添加整秒时间点
      const secondTime = Math.round(time / 1000) * 1000;
      if (Math.abs(secondTime - time) <= snapThreshold) {
        targets.push(secondTime);
      }
      
      return [...new Set(targets)].sort((a, b) => a - b);
    },
    
    // 时间转换工具
    timeToPixel: (time) => {
      const { pixelsPerSecond } = get();
      return (time / 1000) * pixelsPerSecond;
    },
    
    pixelToTime: (pixel) => {
      const { pixelsPerSecond } = get();
      return (pixel / pixelsPerSecond) * 1000;
    },
    
    getVisibleTimeRange: () => {
      const { scrollPosition, viewportWidth, pixelsPerSecond } = get();
      const start = (scrollPosition / pixelsPerSecond) * 1000;
      const end = ((scrollPosition + viewportWidth) / pixelsPerSecond) * 1000;
      return { start, end };
    },
    
    // 轨道管理
    addTrackItem: (item) => 
      set((state) => {
        state.tracks.push(item);
        // 按开始时间排序
        state.tracks.sort((a, b) => a.startTime - b.startTime);
      }),
    
    removeTrackItem: (id) => 
      set((state) => {
        state.tracks = state.tracks.filter(track => track.id !== id);
      }),
    
    updateTrackItem: (id, updates) => 
      set((state) => {
        const index = state.tracks.findIndex(track => track.id === id);
        if (index !== -1) {
          Object.assign(state.tracks[index], updates);
          // 如果更新了时间，重新排序
          if (updates.startTime !== undefined || updates.endTime !== undefined) {
            state.tracks.sort((a, b) => a.startTime - b.startTime);
          }
        }
      }),
    
    // 重置
    resetTimeline: () => 
      set(() => ({
        ...initialState,
        tracks: [],
      })),
  }))
);

// 便捷的选择器 hooks
export const useTimelineZoom = () => 
  useTimelineStore((state) => state.pixelsPerSecond);

export const useTimelineScroll = () => 
  useTimelineStore((state) => state.scrollPosition);

export const useSelectedTimeRange = () => 
  useTimelineStore((state) => state.selectedRange);

export const useTimeConversion = () => 
  useTimelineStore((state) => ({
    timeToPixel: state.timeToPixel,
    pixelToTime: state.pixelToTime,
  }));