
export type WatermarkLayoutMode = 'row' | 'row-reverse' | 'col' | 'col-reverse' | 'overlay';

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  imageUrl?: string;
  snapshotUrl?: string;
  layout: WatermarkLayoutMode; 
  positionMode: 'preset' | 'custom';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  customPosition: { x: number; y: number };
  opacity: number;
  fontSize: number;
  fontFamily: string;
  fontWeight?: number;
  fontStyle?: string;
  textDecoration?: string;
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