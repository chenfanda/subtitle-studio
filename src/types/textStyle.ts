export type TextStyleCategory = 'basic' | 'socialMedia' | 'title' | 'note';

export interface TextStyleConfig {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'bolder';
  fontStyle: 'normal' | 'italic';
  color: string;
  backgroundColor?: string;
  border?: string;
  borderRadius?: number;
  padding?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right';
  stroke?: {
    color: string;
    width: number;
  };
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
}

export interface TextStyleTemplate {
  id: string;
  name: string;
  preview: string;
  category: TextStyleCategory;
  style: TextStyleConfig;
}