export type PanelType = 'clips' | 'media' | 'search' | 'audio' | 'text' | 'broll' | 'subtitles';

export interface UIState {
  // 左侧面板
  activePanel: PanelType;
  leftPanelWidth: number;
  leftPanelCollapsed: boolean;
  
  // 字幕编辑
  selectedSubtitleIds: string[];
  editingSubtitleId: string | null;
  
  // 时间轴
  timelineZoom: number; // pixels per second
  timelineScrollLeft: number;
  
  // 模态框和弹窗
  showSettingsModal: boolean;
  showExportModal: boolean;
  showHelpModal: boolean;
  
  // 拖拽状态
  isDragging: boolean;
  dragType: 'subtitle' | 'media' | 'playhead' | null;
}