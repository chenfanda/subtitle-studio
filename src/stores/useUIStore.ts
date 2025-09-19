import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { UIState, PanelType } from '@/types/ui';
import { APP_CONFIG } from '@/constants/config';

interface UIStore extends UIState {
  // 面板控制
  setActivePanel: (panel: PanelType) => void;
  toggleLeftPanel: () => void;
  setLeftPanelWidth: (width: number) => void;
  setLeftPanelCollapsed: (collapsed: boolean) => void;
  
  // 字幕选择和编辑
  setSelectedSubtitles: (ids: string[]) => void;
  addSelectedSubtitle: (id: string) => void;
  removeSelectedSubtitle: (id: string) => void;
  clearSelectedSubtitles: () => void;
  toggleSubtitleSelection: (id: string) => void;
  setEditingSubtitle: (id: string | null) => void;
  
  // 时间轴控制
  setTimelineZoom: (zoom: number) => void;
  adjustTimelineZoom: (delta: number) => void;
  setTimelineScroll: (scrollLeft: number) => void;
  
  // 模态框控制
  setShowSettingsModal: (show: boolean) => void;
  setShowExportModal: (show: boolean) => void;
  setShowHelpModal: (show: boolean) => void;
  closeAllModals: () => void;
  
  // 拖拽状态
  setDragState: (isDragging: boolean, dragType?: UIState['dragType']) => void;
  clearDragState: () => void;
  
  // 快捷操作
  focusNextSubtitle: () => void;
  focusPrevSubtitle: () => void;
  selectAllSubtitles: () => void;
  
  // UI状态重置
  resetUIState: () => void;
}

const initialState: UIState = {
  activePanel: 'audio',
  leftPanelWidth: APP_CONFIG.LEFT_PANEL_WIDTH,
  leftPanelCollapsed: false,
  selectedSubtitleIds: [],
  editingSubtitleId: null,
  timelineZoom: APP_CONFIG.DEFAULT_PIXELS_PER_SECOND,
  timelineScrollLeft: 0,
  showSettingsModal: false,
  showExportModal: false,
  showHelpModal: false,
  isDragging: false,
  dragType: null,
};

export const useUIStore = create<UIStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // 初始状态
      ...initialState,
      
      // 面板控制
      setActivePanel: (panel) => 
        set((state) => {
          state.activePanel = panel;
        }),
      
      toggleLeftPanel: () => 
        set((state) => {
          state.leftPanelCollapsed = !state.leftPanelCollapsed;
        }),
      
      setLeftPanelWidth: (width) => 
        set((state) => {
          state.leftPanelWidth = Math.max(
            APP_CONFIG.MIN_LEFT_PANEL_WIDTH,
            Math.min(APP_CONFIG.MAX_LEFT_PANEL_WIDTH, width)
          );
        }),
      
      setLeftPanelCollapsed: (collapsed) => 
        set((state) => {
          state.leftPanelCollapsed = collapsed;
        }),
      
      // 字幕选择
      setSelectedSubtitles: (ids) => 
        set((state) => {
          state.selectedSubtitleIds = [...new Set(ids)]; // 去重
        }),
      
      addSelectedSubtitle: (id) => 
        set((state) => {
          if (!state.selectedSubtitleIds.includes(id)) {
            state.selectedSubtitleIds.push(id);
          }
        }),
      
      removeSelectedSubtitle: (id) => 
        set((state) => {
          state.selectedSubtitleIds = state.selectedSubtitleIds.filter(
            selectedId => selectedId !== id
          );
        }),
      
      clearSelectedSubtitles: () => 
        set((state) => {
          state.selectedSubtitleIds = [];
          state.editingSubtitleId = null;
        }),
      
      toggleSubtitleSelection: (id) => 
        set((state) => {
          const index = state.selectedSubtitleIds.indexOf(id);
          if (index === -1) {
            state.selectedSubtitleIds.push(id);
          } else {
            state.selectedSubtitleIds.splice(index, 1);
          }
        }),
      
      setEditingSubtitle: (id) => 
        set((state) => {
          state.editingSubtitleId = id;
          
          // 如果开始编辑，确保该字幕被选中
          if (id && !state.selectedSubtitleIds.includes(id)) {
            state.selectedSubtitleIds = [id];
          }
        }),
      
      // 时间轴控制
      setTimelineZoom: (zoom) => 
        set((state) => {
          state.timelineZoom = Math.max(
            APP_CONFIG.MIN_PIXELS_PER_SECOND,
            Math.min(APP_CONFIG.MAX_PIXELS_PER_SECOND, zoom)
          );
        }),
      
      adjustTimelineZoom: (delta) => 
        set((state) => {
          const newZoom = state.timelineZoom + delta;
          state.timelineZoom = Math.max(
            APP_CONFIG.MIN_PIXELS_PER_SECOND,
            Math.min(APP_CONFIG.MAX_PIXELS_PER_SECOND, newZoom)
          );
        }),
      
      setTimelineScroll: (scrollLeft) => 
        set((state) => {
          state.timelineScrollLeft = Math.max(0, scrollLeft);
        }),
      
      // 模态框控制
      setShowSettingsModal: (show) => 
        set((state) => {
          if (show) {
            // 关闭其他模态框
            state.showExportModal = false;
            state.showHelpModal = false;
          }
          state.showSettingsModal = show;
        }),
      
      setShowExportModal: (show) => 
        set((state) => {
          if (show) {
            state.showSettingsModal = false;
            state.showHelpModal = false;
          }
          state.showExportModal = show;
        }),
      
      setShowHelpModal: (show) => 
        set((state) => {
          if (show) {
            state.showSettingsModal = false;
            state.showExportModal = false;
          }
          state.showHelpModal = show;
        }),
      
      closeAllModals: () => 
        set((state) => {
          state.showSettingsModal = false;
          state.showExportModal = false;
          state.showHelpModal = false;
        }),
      
      // 拖拽状态
      setDragState: (isDragging, dragType = null) => 
        set((state) => {
          state.isDragging = isDragging;
          state.dragType = isDragging ? dragType : null;
        }),
      
      clearDragState: () => 
        set((state) => {
          state.isDragging = false;
          state.dragType = null;
        }),
      
      // 快捷操作
      focusNextSubtitle: () => {
        const { editingSubtitleId } = get();
        // 这里需要配合 ProjectStore 使用
        // 实际实现会依赖字幕数据
        console.log('Focus next subtitle from:', editingSubtitleId);
      },
      
      focusPrevSubtitle: () => {
        const { editingSubtitleId } = get();
        console.log('Focus prev subtitle from:', editingSubtitleId);
      },
      
      selectAllSubtitles: () => {
        // 这个方法需要在组件中调用，因为需要访问项目store中的字幕数据
        console.log('Select all subtitles');
      },
      
      // 重置
      resetUIState: () => 
        set(() => ({ ...initialState })),
    }))
  )
);

// 修复后的选择器 - 避免创建新对象
export const useSelectedSubtitles = () => 
  useUIStore((state) => state.selectedSubtitleIds);

export const useEditingSubtitle = () => 
  useUIStore((state) => state.editingSubtitleId);

export const useActivePanel = () => 
  useUIStore((state) => state.activePanel);

// 拆分选择器，避免每次创建新对象
export const useLeftPanelWidth = () => 
  useUIStore((state) => state.leftPanelWidth);

export const useLeftPanelCollapsed = () => 
  useUIStore((state) => state.leftPanelCollapsed);

export const useTimelineZoom = () => 
  useUIStore((state) => state.timelineZoom);

export const useTimelineScrollLeft = () => 
  useUIStore((state) => state.timelineScrollLeft);