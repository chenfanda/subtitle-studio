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

// 富文本处理函数
import type { RichTextSegment, SubtitleStyle } from '@/types/subtitle';

export const convertRichTextToPlainText = (segments: RichTextSegment[]): string => {
  return segments.map(segment => segment.text).join('');
};

export const createRichTextFromPlainText = (text: string, baseStyle?: SubtitleStyle): RichTextSegment[] => {
  return [{
    text: text,
    style: baseStyle ? {} : undefined
  }];
};

export const applyStyleToSegments = (
  segments: RichTextSegment[], 
  startIndex: number, 
  endIndex: number, 
  style: Partial<SubtitleStyle>
): RichTextSegment[] => {
  const result: RichTextSegment[] = [];
  let currentIndex = 0;
  
  for (const segment of segments) {
    const segmentStart = currentIndex;
    const segmentEnd = currentIndex + segment.text.length;
    
    // 片段完全在选择范围之外
    if (segmentEnd <= startIndex || segmentStart >= endIndex) {
      result.push(segment);
      currentIndex = segmentEnd;
      continue;
    }
    
    // 片段与选择范围有交集，需要分割
    const beforeText = segment.text.slice(0, Math.max(0, startIndex - segmentStart));
    const selectedText = segment.text.slice(
      Math.max(0, startIndex - segmentStart),
      Math.min(segment.text.length, endIndex - segmentStart)
    );
    const afterText = segment.text.slice(Math.min(segment.text.length, endIndex - segmentStart));
    
    // 添加选择范围前的部分
    if (beforeText) {
      result.push({
        text: beforeText,
        style: segment.style
      });
    }
    
    // 添加选择范围内的部分（应用新样式）
    if (selectedText) {
      result.push({
        text: selectedText,
        style: { ...segment.style, ...style }
      });
    }
    
    // 添加选择范围后的部分
    if (afterText) {
      result.push({
        text: afterText,
        style: segment.style
      });
    }
    
    currentIndex = segmentEnd;
  }
  
  return result;
};

export const mergeAdjacentSegments = (segments: RichTextSegment[]): RichTextSegment[] => {
  if (segments.length <= 1) return segments;
  
  const result: RichTextSegment[] = [];
  let current = segments[0];
  
  for (let i = 1; i < segments.length; i++) {
    const next = segments[i];
    
    // 检查样式是否相同
    if (JSON.stringify(current.style) === JSON.stringify(next.style)) {
      // 合并相邻的相同样式片段
      current = {
        text: current.text + next.text,
        style: current.style
      };
    } else {
      result.push(current);
      current = next;
    }
  }
  
  result.push(current);
  return result;
};

export const getTextSelectionFromSegments = (segments: RichTextSegment[], startIndex: number, endIndex: number): string => {
  const fullText = convertRichTextToPlainText(segments);
  return fullText.slice(startIndex, endIndex);
};

export const convertSegmentsToCSS = (segments: RichTextSegment[], baseStyle: SubtitleStyle): React.CSSProperties[] => {
  return segments.map(segment => {
    const mergedStyle = { ...baseStyle, ...segment.style };
    return convertStyleToCSS(mergedStyle);
  });
};