import type { TextStyleConfig, TextStyleTemplate } from '@/types/textStyle';

export const convertStyleToCSS = (style: TextStyleConfig): React.CSSProperties => {
  const cssStyle: React.CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    color: style.color,
    textAlign: style.textAlign || 'center',
  };

  if (style.backgroundColor) {
    cssStyle.backgroundColor = style.backgroundColor;
  }

  if (style.border) {
    cssStyle.border = style.border;
  }

  if (style.borderRadius) {
    cssStyle.borderRadius = `${style.borderRadius}px`;
  }

  if (style.padding) {
    cssStyle.padding = style.padding;
  }

  if (style.textTransform) {
    cssStyle.textTransform = style.textTransform;
  }

  if (style.letterSpacing) {
    cssStyle.letterSpacing = `${style.letterSpacing}px`;
  }

  if (style.stroke) {
    cssStyle.WebkitTextStroke = `${style.stroke.width}px ${style.stroke.color}`;
  }

  if (style.shadow) {
    cssStyle.textShadow = `${style.shadow.offsetX}px ${style.shadow.offsetY}px ${style.shadow.blur}px ${style.shadow.color}`;
  }

  return cssStyle;
};

export const convertStyleToFFmpeg = (style: TextStyleConfig): string => {
  const parts: string[] = [];
  
  parts.push(`fontfile='${getFontPath(style.fontFamily)}'`);
  parts.push(`fontsize=${style.fontSize}`);
  parts.push(`fontcolor=${style.color}`);
  
  if (style.stroke) {
    parts.push(`borderw=${style.stroke.width}`);
    parts.push(`bordercolor=${style.stroke.color}`);
  }
  
  if (style.shadow) {
    parts.push(`shadowx=${style.shadow.offsetX}`);
    parts.push(`shadowy=${style.shadow.offsetY}`);
    parts.push(`shadowcolor=${style.shadow.color}`);
  }

  const alignment = getFFmpegAlignment(style.textAlign);
  if (alignment) {
    parts.push(alignment);
  }

  return parts.join(':');
};

export const mergeStyles = (baseStyle: TextStyleConfig, overrideStyle: Partial<TextStyleConfig>): TextStyleConfig => {
  return {
    ...baseStyle,
    ...overrideStyle,
    stroke: overrideStyle.stroke ? { ...baseStyle.stroke, ...overrideStyle.stroke } : baseStyle.stroke,
    shadow: overrideStyle.shadow ? { ...baseStyle.shadow, ...overrideStyle.shadow } : baseStyle.shadow
  };
};

export const validateStyle = (style: TextStyleConfig): boolean => {
  if (!style.fontFamily || style.fontSize <= 0) return false;
  if (!isValidColor(style.color)) return false;
  if (style.backgroundColor && !isValidColor(style.backgroundColor)) return false;
  return true;
};

export const calculateTextBounds = (text: string, style: TextStyleConfig): { width: number; height: number } => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return { width: 0, height: 0 };
  
  ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
  const metrics = ctx.measureText(text);
  
  const width = metrics.width + (style.stroke?.width || 0) * 2;
  const height = style.fontSize * 1.2 + (style.stroke?.width || 0) * 2;
  
  return { width, height };
};

export const generateStylePreview = (template: TextStyleTemplate): string => {
  const style = convertStyleToCSS(template.style);
  const styleString = Object.entries(style)
    .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
    .join('; ');
  
  return `<div style="${styleString}">${template.preview}</div>`;
};

const getFontPath = (fontFamily: string): string => {
  const fontMap: Record<string, string> = {
    'Arial': '/fonts/arial.ttf',
    '微软雅黑': '/fonts/msyh.ttf',
    '思源黑体': '/fonts/SourceHanSans.ttf',
    'Helvetica': '/fonts/helvetica.ttf',
    'Times New Roman': '/fonts/times.ttf'
  };
  return fontMap[fontFamily] || '/fonts/arial.ttf';
};

const getFFmpegAlignment = (textAlign?: string): string => {
  switch (textAlign) {
    case 'left': return 'x=10';
    case 'right': return 'x=w-tw-10';
    case 'center': return 'x=(w-tw)/2';
    default: return 'x=(w-tw)/2';
  }
};

const isValidColor = (color: string): boolean => {
  const hexPattern = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
  const rgbPattern = /^rgb\(\d+,\s*\d+,\s*\d+\)$/;
  const rgbaPattern = /^rgba\(\d+,\s*\d+,\s*\d+,\s*\d*\.?\d+\)$/;
  
  return hexPattern.test(color) || rgbPattern.test(color) || rgbaPattern.test(color);
};

const camelToKebab = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
};