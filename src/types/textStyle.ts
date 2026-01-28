export type TextStyleCategory = 'basic' | 'socialMedia' | 'title' | 'note';

export interface TextStyleConfig {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'bolder';
  fontStyle: 'normal' | 'italic';
  color: string;

  // --- 新增背景相关 ---
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundRepeat?: string;

  border?: string;
  borderRadius?: number | string;
  padding?: string;

  // --- 修复报错：添加 minWidth ---
  minWidth?: string | number;

  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right';

  // --- 新增布局相关 ---
  display?: 'flex';
  alignItems?: 'center';
  justifyContent?: 'center';
  gap?: string;

  // --- 新增图标相关 ---
  icon?: string;
  iconSize?: number;

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

  // --- Glow / Highlight Support ---
  highlightColor?: string;
  highlightIntensity?: number;
}

export interface TextStyleTemplate {
  id: string;
  name: string;
  preview: string;
  category: TextStyleCategory;
  style: TextStyleConfig;
}