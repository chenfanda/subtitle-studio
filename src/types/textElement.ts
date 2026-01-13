
import type { SubtitleStyle, RichTextSegment } from './subtitle';
import type { KaraokeEffectConfig } from './animation'; 
export type TextElementType = 'basic' | 'socialMedia' | 'title' | 'note';

export interface TextElementPosition {
  x: number;        // 百分比定位 0-100
  y: number;        // 百分比定位 0-100
  scaleX: number;   // X轴缩放
  scaleY: number;   // Y轴缩放
  rotation: number; // 旋转角度 0-360
}

export interface TextElement {
  id: string;
  type: TextElementType;
  text: string;                    
  position: TextElementPosition;
  style: SubtitleStyle;
  richText?: RichTextSegment[];
  startTime: number;               
  endTime: number;                 
  layer: number;                 
  dynamicConfig?: KaraokeEffectConfig;
}

export const DEFAULT_TEXT_ELEMENT_POSITION: TextElementPosition = {
  x: 50,
  y: 50,
  scaleX: 1.0,
  scaleY: 1.0,
  rotation: 0
};