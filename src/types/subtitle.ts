import type { AudioTrack } from './audio';
import type { BrollVideoData } from './broll';

export interface SubtitlePosition {
  x: number;
  y: number;
  scale: number;
  width?: number;  // 容器宽度（像素）
}

export interface SubtitleShadow {
  enabled: boolean;
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
}

export interface SubtitleStyle {
  // 基础文字属性
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  color: string;  // 填充色
  
  // 🆕 新增属性
  letterSpacing?: number;        // 文字间距（仅字幕使用）
  textDecoration?: string;       // 文字装饰（'none' | 'underline' | 'line-through' | 'underline line-through'）
  highlightColor?: string;       // 高亮色（文字背景高亮，仅字幕使用）
  
  // 容器属性
  backgroundColor: string;       // 背景色（整个容器背景）
  position: 'top' | 'center' | 'bottom';
  alignment: 'left' | 'center' | 'right';
  opacity: number;
  
  // 描边（通用）
  stroke?: {
    enabled: boolean;
    color: string;
    width: number;
  };
  
  // 阴影
  shadow: SubtitleShadow;
}

export interface RichTextSegment {
  text: string;
  style?: SubtitleStyle;
  animation?: any;
}

export interface SubtitleAudioData {
  track: AudioTrack;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

export interface SubtitleItem {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  style?: SubtitleStyle;
  position?: SubtitlePosition;
  richText?: RichTextSegment[];
  audioTrack?: SubtitleAudioData;
  brollVideo?: BrollVideoData;
}

export const DEFAULT_SUBTITLE_POSITION: SubtitlePosition = {
  x: 50,
  y: 85,
  scale: 1.0,
  width: undefined,
};

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontSize: 24,
  fontFamily: 'Arial',
  fontWeight: 600,
  fontStyle: 'normal',
  color: '#ffffff',
  
  // 🆕 新增属性的默认值
  letterSpacing: 0,           // 默认无额外间距
  textDecoration: 'none',     // 默认无装饰
  highlightColor: undefined,  // 默认无高亮
  
  backgroundColor: 'transparent',
  position: 'bottom',
  alignment: 'center',
  opacity: 1,
  shadow: {
    enabled: true,
    color: '#000000',
    offsetX: 2,
    offsetY: 2,
    blur: 4,
  },
};