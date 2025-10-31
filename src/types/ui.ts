export type PanelType = 'clips' | 'media' | 'search' | 'audio' | 'text' | 'broll' | 'subtitles' | 'templates';

export interface RichTextSelection {
  subtitleId: string;
  startIndex: number;
  endIndex: number;
}

// 1. (修改) 扩展附件类型，以包含我们的新音频类型
export type AttachmentType = 
  'audio' |         // 字幕配音 (Voiceover)
  'broll' |
  'sticker' |
  'soundEffect' |   // <-- 新增：音效 (SFX)
  'backgroundMusic';// <-- 新增：背景音乐 (BGM)

// 2. (修改) 将 SelectedAttachment 重构为可辨识联合类型

// 这些附件类型必须关联一个字幕
type SubtitleAttachment = {
  type: 'audio' | 'broll' | 'sticker' | 'soundEffect';
  subtitleId: string;
}

// 这种附件类型是全局的，没有 subtitleId
type GlobalAttachment = {
  type: 'backgroundMusic';
  subtitleId?: never; // 显式禁止 subtitleId
}

// 导出的 SelectedAttachment 现在是这两种类型的联合
export type SelectedAttachment = SubtitleAttachment | GlobalAttachment;


export interface UIState {
  // 左侧面板
  activePanel: PanelType;
  leftPanelWidth: number;
  leftPanelCollapsed: boolean;

  // 字幕编辑
  selectedSubtitleIds: string[];
  editingSubtitleId: string | null;

  // 3. (不变) 附件选择状态
  // 这里的类型现在是上面定义的新的联合类型
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