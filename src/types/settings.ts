
/**
 * 水印配置接口
 * [来源: useSettingsStore.ts, line 5]
 */
export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  positionMode: 'preset' | 'custom';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; // 预设模式
  customPosition: { x: number; y: number }; // 自定义模式，百分比位置
  opacity: number; // 0-100
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
}

/**
 * 完整设置的状态接口
 * [来源: useSettingsStore.ts, line 28]
 */
export interface SettingsState {
  // 用户偏好设置
  theme: 'dark' | 'light';
  language: 'zh-CN' | 'en-US';
  
  // 编辑器设置
  autoSave: boolean;
  autoSaveInterval: number; // 秒
  showWaveform: boolean;
  snapToGrid: boolean;
  
  // 快捷键设置
  customShortcuts: Record<string, string>;
  enableShortcuts: boolean;
  
  // 视频设置
  defaultVolume: number;
  defaultPlaybackRate: number;
  previewQuality: 'low' | 'medium' | 'high';
  
  // 字幕设置
  defaultFontSize: number;
  defaultFontFamily: string;
  defaultTextColor: string;
  defaultBackgroundColor: string;
  
  // 导出设置
  exportFormat: 'srt' | 'vtt' | 'ass';
  exportEncoding: 'utf-8' | 'gbk';
  
  // 界面设置
  leftPanelDefaultWidth: number;
  timelineHeight: number;
  showGridLines: boolean;
  showTimeCodes: boolean;
  
  // 水印设置
  watermark: WatermarkConfig;
}