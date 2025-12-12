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
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  color: string;
  
  letterSpacing?: number;
  textDecoration?: string;
  highlightColor?: string;
  highlightIntensity?: number;
  
  backgroundColor: string;
  backgroundShape?: number;
  position: 'top' | 'center' | 'bottom';
  alignment: 'left' | 'center' | 'right';
  verticalAlignment: 'top' | 'center' | 'bottom';
  opacity: number;
  
  stroke?: {
    enabled: boolean;
    color: string;
    width: number;
  };
  
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

export interface SubtitleSoundEffectData {
  track: AudioTrack;
  volume: number;
}

export interface SourceMixConfig {
  mainVideoVolume?: number;
  originalVocalVolume?: number;
  backingVolume?: number;
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
  soundEffect?: SubtitleSoundEffectData;
  brollVideo?: BrollVideoData;
  sourceMix?: SourceMixConfig;
  speaker?: string;
}

export const DEFAULT_SUBTITLE_POSITION: SubtitlePosition = {
  x: 50,
  y: 85,
  scale: 1.0,
  width: undefined,
};

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontSize: 24,
  fontFamily: '"Alibaba PuHuiTi", sans-serif',
  fontWeight: 600,
  fontStyle: 'normal',
  color: '#ffffff',
  
  letterSpacing: 0,
  textDecoration: 'none',
  highlightColor: undefined,
  highlightIntensity: 15,
  
  backgroundColor: 'transparent',
  backgroundShape: 0,
  position: 'bottom',
  alignment: 'center',
  verticalAlignment: 'center',
  opacity: 1,
  shadow: {
    enabled: false,
    color: '#000000',
    offsetX: 2,
    offsetY: 2,
    blur: 4,
  },
};