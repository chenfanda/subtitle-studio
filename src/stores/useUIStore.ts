import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { UIState, PanelType, RichTextSelection } from '@/types/ui';
import { APP_CONFIG } from '@/constants/config';

interface UIStore extends UIState {
  // 富文本选中状态
  richTextSelection: RichTextSelection | null;
  setRichTextSelection: (selection: RichTextSelection | null) => void;
  clearRichTextSelection: () => void;
  
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
      richTextSelection: null,
      
      // 富文本选中状态
      setRichTextSelection: (selection) =>
        set((state) => {
          state.richTextSelection = selection;
        }),
      
      clearRichTextSelection: () =>
        set((state) => {
          state.richTextSelection = null;
        }),
      
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
          state.selectedSubtitleIds = [...new Set(ids)];
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
          state.richTextSelection = null;
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
          
          if (id && !state.selectedSubtitleIds.includes(id)) {
            state.selectedSubtitleIds = [id];
          }
          
          if (!id) {
            state.richTextSelection = null;
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
        console.log('Focus next subtitle from:', editingSubtitleId);
      },
      
      focusPrevSubtitle: () => {
        const { editingSubtitleId } = get();
        console.log('Focus prev subtitle from:', editingSubtitleId);
      },
      
      selectAllSubtitles: () => {
        console.log('Select all subtitles');
      },
      
      // 重置
      resetUIState: () => 
        set(() => ({ 
          ...initialState,
          richTextSelection: null
        })),
    }))
  )
);

export const useSelectedSubtitles = () => 
  useUIStore((state) => state.selectedSubtitleIds);

export const useEditingSubtitle = () => 
  useUIStore((state) => state.editingSubtitleId);

export const useActivePanel = () => 
  useUIStore((state) => state.activePanel);

export const useRichTextSelection = () =>
  useUIStore((state) => state.richTextSelection);

export const useLeftPanelWidth = () => 
  useUIStore((state) => state.leftPanelWidth);

export const useLeftPanelCollapsed = () => 
  useUIStore((state) => state.leftPanelCollapsed);

export const useTimelineZoom = () => 
  useUIStore((state) => state.timelineZoom);

export const useTimelineScrollLeft = () => 
  useUIStore((state) => state.timelineScrollLeft);