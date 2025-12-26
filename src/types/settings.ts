
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

export interface MaskConfig {
  enabled: boolean;
  x: number;      
  y: number;      
  width: number;  
  height: number; 
  mode: 'blur' | 'mosaic';
  intensity: number; 
}

export interface SettingsState {
  
  theme: 'dark' | 'light';
  language: 'zh-CN' | 'en-US';
  
  
  autoSave: boolean;
  autoSaveInterval: number; 
  showWaveform: boolean;
  snapToGrid: boolean;
  
  
  customShortcuts: Record<string, string>;
  enableShortcuts: boolean;
  
  
  defaultVolume: number;
  defaultPlaybackRate: number;
  previewQuality: 'low' | 'medium' | 'high';
  
  
  defaultFontSize: number;
  defaultFontFamily: string;
  defaultTextColor: string;
  defaultBackgroundColor: string;
  
  
  exportFormat: 'srt' | 'vtt' | 'ass';
  exportEncoding: 'utf-8' | 'gbk';
  
  leftPanelDefaultWidth: number;
  timelineHeight: number;
  showGridLines: boolean;
  showTimeCodes: boolean;
  
  watermark: WatermarkConfig;
  mask: MaskConfig; 
}