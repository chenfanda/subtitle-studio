// 1. (新增) 定义剪辑面板的任务类型
export type ClipTask = 'subtitles' | 'videos';

export type PanelType = 'clips' | 'media' | 'search' | 'audio' | 'text' | 'broll' | 'subtitles' | 'templates';

export interface RichTextSelection {
  subtitleId: string;
  startIndex: number;
  endIndex: number;
}

export type AttachmentType = 
  'audio' |         
  'broll' |
  'sticker' |
  'soundEffect' |   
  'backgroundMusic';

export type SelectedAttachment = {
  type: 'audio' | 'broll' | 'sticker' | 'soundEffect';
  subtitleId: string;
} | {
  type: 'backgroundMusic';
  subtitleId?: never; 
}


export interface UIState {
  // 左侧面板
  activePanel: PanelType;
  leftPanelWidth: number;
  leftPanelCollapsed: boolean;

  // 字幕编辑
  selectedSubtitleIds: string[];
  editingSubtitleId: string | null;
  
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
  
  // 2. (新增) 添加我们 ClipsPanel 所需的状态
  activeClipTask: ClipTask;
}