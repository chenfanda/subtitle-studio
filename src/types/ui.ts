export type PanelType = 'clips' | 'media' | 'search' | 'audio' | 'text' | 'broll' | 'subtitles' | 'templates';

export interface RichTextSelection {
  subtitleId: string;
  startIndex: number;
  endIndex: number;
}

// 1. (新增) 定义附件类型
export type AttachmentType = 'audio' | 'broll' | 'sticker';

// 2. (新增) 定义附件选择状态的接口
export interface SelectedAttachment {
  type: AttachmentType;
  subtitleId: string; // 对应的父字幕ID
}

export interface UIState {
  // 左侧面板
  activePanel: PanelType;
  leftPanelWidth: number;
  leftPanelCollapsed: boolean;
  
  // 字幕编辑
  selectedSubtitleIds: string[];
  editingSubtitleId: string | null;

  // 3. (新增) 附件选择状态
  selectedAttachment: SelectedAttachment | null;
  
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