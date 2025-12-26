import type { ProjectExport } from '@/types/project';
import type { SubtitleItem, SubtitleStyle, RichTextSegment } from '@/types/subtitle';
import type { TextElement } from '@/types/textElement';

interface CompatibilityResult {
  isCompatible: boolean;
  issues: string[];
}

const checkStyleCompatibility = (style: SubtitleStyle | undefined, label: string): string | null => {
  if (!style) return null;

  // 1. 检查发光
  if (style.highlightColor && (style.highlightIntensity || 0) > 0) {
    return `${label}使用了发光特效`;
  }

  // 2. 检查柔和阴影
  if (style.shadow?.enabled && style.shadow.blur > 0) {
    return `${label}使用了柔和阴影`;
  }

  // 3. 检查圆角背景
  if (style.backgroundColor !== 'transparent' && (style.backgroundShape || 0) > 0) {
    return `${label}使用了圆角背景`;
  }

  return null;
};

export const checkFrontendCompatibility = (project: ProjectExport): CompatibilityResult => {
  const issues = new Set<string>();

  // 1. 检查字幕
  if (project.content.subtitles) {
    project.content.subtitles.forEach((sub: SubtitleItem) => {
      const prefix = "字幕";

      if (sub.style) {
        const styleIssue = checkStyleCompatibility(sub.style, prefix);
        if (styleIssue) issues.add(styleIssue);
      }

      if (sub.richText && sub.richText.length > 1) {
        issues.add(`${prefix}使用了多样式混排`);
      }

      const hasAnimation = sub.richText?.some((seg: RichTextSegment) => seg.animation);
      if (hasAnimation) {
        issues.add(`${prefix}使用了动态进出场效果`);
      }

      if (sub.brollVideo?.transition === 'glow') {
        issues.add("B-Roll使用了光晕转场");
      }
    });
  }

  // 2. 检查文字元素
  if (project.content.textElements) {
    project.content.textElements.forEach((el: TextElement) => {
      const prefix = "贴纸文字";
      
      const styleIssue = checkStyleCompatibility(el.style, prefix);
      if (styleIssue) issues.add(styleIssue);

      if (el.richText && el.richText.length > 1) {
        issues.add(`${prefix}使用了多样式混排`);
      }

      const hasAnimation = el.richText?.some((seg: RichTextSegment) => seg.animation);
      if (hasAnimation) {
        issues.add(`${prefix}使用了动态效果`);
      }
    });
  }

  return {
    isCompatible: issues.size === 0,
    issues: Array.from(issues)
  };
};

export const sanitizeProjectForFrontend = (project: ProjectExport): ProjectExport => {
  const cleanProject = JSON.parse(JSON.stringify(project)) as ProjectExport;

  const sanitizeStyle = (style: SubtitleStyle) => {
    if (style.highlightColor) delete style.highlightColor;
    if (style.shadow) style.shadow.blur = 0;
    if (style.backgroundShape) style.backgroundShape = 0;
  };

  // 处理字幕
  if (cleanProject.content.subtitles) {
    cleanProject.content.subtitles = cleanProject.content.subtitles.map((sub: SubtitleItem) => {
      if (sub.style) sanitizeStyle(sub.style);
      
      if (sub.richText) {
        sub.richText = sub.richText.map((seg: RichTextSegment) => {
          const { animation, ...rest } = seg;
          if (rest.style) sanitizeStyle(rest.style);
          return rest;
        });
      }

      let newBroll = sub.brollVideo;
      if (newBroll && newBroll.transition === 'glow') {
        newBroll = { ...newBroll, transition: 'fade' };
      }

      return { ...sub, brollVideo: newBroll };
    });
  }

  // 处理文字元素
  if (cleanProject.content.textElements) {
    cleanProject.content.textElements = cleanProject.content.textElements.map((el: TextElement) => {
      if (el.style) sanitizeStyle(el.style);
      
      if (el.richText) {
        el.richText = el.richText.map((seg: RichTextSegment) => {
          const { animation, ...rest } = seg;
          if (rest.style) sanitizeStyle(rest.style);
          return rest;
        });
      }
      return el;
    });
  }

  return cleanProject;
};

export const canUsePureFFmpeg = (project: ProjectExport): boolean => {
  if (project.content.subtitles) {
    for (const sub of project.content.subtitles) {
      if (sub.richText && sub.richText.some((seg: RichTextSegment) => seg.animation)) {
        return false;
      }

      if (sub.style) {
        if (sub.style.highlightColor && (sub.style.highlightIntensity || 0) > 0) {
          return false;
        }

        if (sub.style.backgroundColor !== 'transparent' && (sub.style.backgroundShape || 0) > 0) {
          return false;
        }
      }

      if (sub.brollVideo?.transition === 'glow') {
        return false;
      }
    }
  }

  if (project.content.textElements) {
    for (const el of project.content.textElements) {
      if (el.richText && el.richText.some((seg: RichTextSegment) => seg.animation)) {
        return false;
      }
    }
  }

  return true;
};