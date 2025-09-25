import type { AudioTrack } from './audio';

export interface SubtitlePosition {
  x: number;
  y: number;
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
  backgroundColor: string;
  position: 'top' | 'center' | 'bottom';
  alignment: 'left' | 'center' | 'right';
  opacity: number;
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
}

export const DEFAULT_SUBTITLE_POSITION: SubtitlePosition = {
  x: 50,
  y: 85,
};

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontSize: 24,
  fontFamily: 'Arial',
  fontWeight: 600,
  fontStyle: 'normal',
  color: '#ffffff',
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