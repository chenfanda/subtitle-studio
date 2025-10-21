import type { RichTextSegment, SubtitleStyle } from '@/types/subtitle';
import type { AnimationEffect } from '@/types/animation';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';

export const convertRichTextToPlainText = (richText: RichTextSegment[]): string => {
  return richText.map(segment => segment.text).join('');
};

export const createRichTextFromPlainText = (
  text: string, 
  style?: SubtitleStyle
): RichTextSegment[] => {
  if (!text) return [];
  
  return [{
    text,
    style: style || { ...DEFAULT_SUBTITLE_STYLE },
    animation: undefined
  }];
};

export const updateRichTextFromPlainText = (
  existingSegments: RichTextSegment[],
  newPlainText: string
): RichTextSegment[] => {
  if (!newPlainText) return [];
  
  if (!existingSegments || existingSegments.length === 0) {
    return [{
      text: newPlainText,
      style: { ...DEFAULT_SUBTITLE_STYLE },
      animation: undefined
    }];
  }
  
  if (existingSegments.length === 1) {
    return [{
      ...existingSegments[0],
      text: newPlainText
    }];
  }
  
  const originalLength = convertRichTextToPlainText(existingSegments).length;
  const newLength = newPlainText.length;
  
  if (Math.abs(originalLength - newLength) <= originalLength * 0.1) {
    let currentIndex = 0;
    const result: RichTextSegment[] = [];
    
    for (const segment of existingSegments) {
      const segmentRatio = segment.text.length / originalLength;
      const newSegmentLength = Math.round(newLength * segmentRatio);
      const segmentText = newPlainText.substring(currentIndex, currentIndex + newSegmentLength);
      
      if (segmentText) {
        result.push({
          ...segment,
          text: segmentText
        });
        currentIndex += newSegmentLength;
      }
    }
    
    return result;
  } else {
    return [{
      text: newPlainText,
      style: existingSegments[0]?.style || { ...DEFAULT_SUBTITLE_STYLE },
      animation: existingSegments[0]?.animation
    }];
  }
};

export const convertStyleToCSS = (style?: SubtitleStyle): React.CSSProperties => {
  if (!style) return {};
  
  const cssProperties: React.CSSProperties = {
    fontSize: `${style.fontSize}px`,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    color: style.color,
    backgroundColor: style.backgroundColor,
    opacity: style.opacity,
    textAlign: style.alignment,
  };
  
  const textShadows: string[] = [];
  
  if (style.shadow?.enabled) {
    textShadows.push(
      `${style.shadow.offsetX}px ${style.shadow.offsetY}px ${style.shadow.blur}px ${style.shadow.color}`
    );
  }
  
  if (style.highlightColor) {
    const intensity = style.highlightIntensity || 15;
    textShadows.push(
      `0 0 ${intensity}px ${style.highlightColor}`,
      `0 0 ${intensity * 1.5}px ${style.highlightColor}`,
      `0 0 ${intensity * 2}px ${style.highlightColor}`
    );
  }
  
  if (textShadows.length > 0) {
    cssProperties.textShadow = textShadows.join(', ');
  }
  
  if (style.stroke?.enabled && style.stroke.width > 0) {
    cssProperties.WebkitTextStroke = `${style.stroke.width}px ${style.stroke.color}`;
  }
  
  if (style.letterSpacing !== undefined && style.letterSpacing !== 0) {
    cssProperties.letterSpacing = `${style.letterSpacing}px`;
  }
  
  if (style.textDecoration && style.textDecoration !== 'none') {
    cssProperties.textDecoration = style.textDecoration;
  }
  
  if (style.backgroundColor && style.backgroundColor !== 'transparent') {
    if (style.backgroundShape !== undefined && style.backgroundShape > 0) {
      if (style.backgroundShape === 50) {
        cssProperties.borderRadius = '50%';
      } else {
        cssProperties.borderRadius = `${style.backgroundShape}px`;
      }
    }
  }
  
  return cssProperties;
};

export const applyStyleToSegments = (
  segments: RichTextSegment[],
  startIndex: number,
  endIndex: number,
  newStyle: Partial<SubtitleStyle>
): RichTextSegment[] => {
  const result: RichTextSegment[] = [];
  let currentIndex = 0;
  
  for (const segment of segments) {
    const segmentStart = currentIndex;
    const segmentEnd = currentIndex + segment.text.length;
    
    if (segmentEnd <= startIndex || segmentStart >= endIndex) {
      result.push({ ...segment });
    } else if (segmentStart >= startIndex && segmentEnd <= endIndex) {
      result.push({
        ...segment,
        style: {
          ...DEFAULT_SUBTITLE_STYLE,
          ...(segment.style || {}),
          ...newStyle,
          shadow: {
            ...DEFAULT_SUBTITLE_STYLE.shadow,
            ...(segment.style?.shadow || {}),
            ...(newStyle.shadow || {})
          },
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0,
            ...(segment.style?.stroke || {}),
            ...(newStyle.stroke || {})
          },
          highlightIntensity: newStyle.highlightIntensity !== undefined 
            ? newStyle.highlightIntensity 
            : segment.style?.highlightIntensity,
          backgroundShape: newStyle.backgroundShape !== undefined
            ? newStyle.backgroundShape
            : segment.style?.backgroundShape
        },
        animation: segment.animation
      });
    } else {
      const beforeText = segment.text.substring(0, Math.max(0, startIndex - segmentStart));
      const selectedText = segment.text.substring(
        Math.max(0, startIndex - segmentStart),
        Math.min(segment.text.length, endIndex - segmentStart)
      );
      const afterText = segment.text.substring(Math.min(segment.text.length, endIndex - segmentStart));
      
      if (beforeText) {
        result.push({
          text: beforeText,
          style: segment.style,
          animation: segment.animation
        });
      }
      
      if (selectedText) {
        result.push({
          text: selectedText,
          style: {
            ...DEFAULT_SUBTITLE_STYLE,
            ...(segment.style || {}),
            ...newStyle,
            shadow: {
              ...DEFAULT_SUBTITLE_STYLE.shadow,
              ...(segment.style?.shadow || {}),
              ...(newStyle.shadow || {})
            },
            stroke: {
              enabled: false,
              color: '#000000',
              width: 0,
              ...(segment.style?.stroke || {}),
              ...(newStyle.stroke || {})
            },
            highlightIntensity: newStyle.highlightIntensity !== undefined 
              ? newStyle.highlightIntensity 
              : segment.style?.highlightIntensity,
            backgroundShape: newStyle.backgroundShape !== undefined
              ? newStyle.backgroundShape
              : segment.style?.backgroundShape
          },
          animation: segment.animation
        });
      }
      
      if (afterText) {
        result.push({
          text: afterText,
          style: segment.style,
          animation: segment.animation
        });
      }
    }
    
    currentIndex += segment.text.length;
  }
  
  return result;
};

export const applyStyleToAllSegments = (
  segments: RichTextSegment[],
  newStyle: Partial<SubtitleStyle>
): RichTextSegment[] => {
  return segments.map(segment => ({
    ...segment,
    style: {
      ...DEFAULT_SUBTITLE_STYLE,
      ...(segment.style || {}),
      ...newStyle,
      shadow: {
        ...DEFAULT_SUBTITLE_STYLE.shadow,
        ...(segment.style?.shadow || {}),
        ...(newStyle.shadow || {})
      },
      stroke: {
        enabled: false,
        color: '#000000',
        width: 0,
        ...(segment.style?.stroke || {}),
        ...(newStyle.stroke || {})
      },
      highlightIntensity: newStyle.highlightIntensity !== undefined 
        ? newStyle.highlightIntensity 
        : segment.style?.highlightIntensity,
      backgroundShape: newStyle.backgroundShape !== undefined
        ? newStyle.backgroundShape
        : segment.style?.backgroundShape
    },
    animation: segment.animation
  }));
};

export const applyStyleToSegmentsByRange = (
  segments: RichTextSegment[],
  startIndex: number,
  endIndex: number,
  newStyle: Partial<SubtitleStyle>
): RichTextSegment[] => {
  return applyStyleToSegments(segments, startIndex, endIndex, newStyle);
};

export const applyAnimationToSegments = (
  segments: RichTextSegment[],
  startIndex: number,
  endIndex: number,
  animation: AnimationEffect
): RichTextSegment[] => {
  const result: RichTextSegment[] = [];
  let currentIndex = 0;
  
  for (const segment of segments) {
    const segmentStart = currentIndex;
    const segmentEnd = currentIndex + segment.text.length;
    
    if (segmentEnd <= startIndex || segmentStart >= endIndex) {
      result.push({ ...segment });
    } else if (segmentStart >= startIndex && segmentEnd <= endIndex) {
      result.push({
        ...segment,
        style: segment.style,
        animation: { ...animation }
      });
    } else {
      const beforeText = segment.text.substring(0, Math.max(0, startIndex - segmentStart));
      const selectedText = segment.text.substring(
        Math.max(0, startIndex - segmentStart),
        Math.min(segment.text.length, endIndex - segmentStart)
      );
      const afterText = segment.text.substring(Math.min(segment.text.length, endIndex - segmentStart));
      
      if (beforeText) {
        result.push({
          text: beforeText,
          style: segment.style,
          animation: segment.animation
        });
      }
      
      if (selectedText) {
        result.push({
          text: selectedText,
          style: segment.style,
          animation: { ...animation }
        });
      }
      
      if (afterText) {
        result.push({
          text: afterText,
          style: segment.style,
          animation: segment.animation
        });
      }
    }
    
    currentIndex += segment.text.length;
  }
  
  return result;
};

export const applyAnimationToSegmentsByRange = (
  segments: RichTextSegment[],
  startIndex: number,
  endIndex: number,
  animation: AnimationEffect
): RichTextSegment[] => {
  return applyAnimationToSegments(segments, startIndex, endIndex, animation);
};

export const mergeAdjacentSegments = (segments: RichTextSegment[]): RichTextSegment[] => {
  if (segments.length <= 1) return segments;
  
  const result: RichTextSegment[] = [segments[0]];
  
  for (let i = 1; i < segments.length; i++) {
    const current = segments[i];
    const last = result[result.length - 1];
    
    if (
      JSON.stringify(current.style) === JSON.stringify(last.style) &&
      JSON.stringify(current.animation) === JSON.stringify(last.animation)
    ) {
      last.text += current.text;
    } else {
      result.push(current);
    }
  }
  
  return result;
};

export const removeAnimationFromSegments = (
  segments: RichTextSegment[],
  startIndex: number,
  endIndex: number
): RichTextSegment[] => {
  return applyAnimationToSegments(segments, startIndex, endIndex, undefined as any)
    .map(segment => ({
      ...segment,
      animation: undefined
    }));
};

export const getSegmentAnimations = (segments: RichTextSegment[]): AnimationEffect[] => {
  const animations: AnimationEffect[] = [];
  const seenAnimations = new Set<string>();
  
  for (const segment of segments) {
    if (segment.animation) {
      const animationKey = JSON.stringify(segment.animation);
      if (!seenAnimations.has(animationKey)) {
        seenAnimations.add(animationKey);
        animations.push(segment.animation);
      }
    }
  }
  
  return animations;
};

export const hasAnyAnimation = (segments: RichTextSegment[]): boolean => {
  return segments.some(segment => segment.animation !== undefined);
};