import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { SubtitleStyle, RichTextSegment } from '@/types/subtitle';
import type {
  AnimationTemplate,
  DynamicStyleTemplate,
  RichTextStyleTemplate,
  AdvancedSceneTemplate 
} from '@/types/animation';
import type { TextStyleTemplate} from '@/types/textStyle';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';
import { DYNAMIC_STYLE_TEMPLATES } from '@/constants/dynamicStyleTemplates';
import { STATIC_STYLE_TEMPLATES } from '@/constants/staticStyleTemplates';
import { ADVANCED_SCENE_TEMPLATES } from '@/constants/advancedTemplates';
import { useSubtitleStore } from '@/stores/useSubtitleStore';

import {
  applyAnimationToSegments,
  applyStyleToAllSegments,
  convertTemplateToSubtitleStyle,
  createRichTextFromPlainText,
  mergeAdjacentSegments,
  removeAnimationFromSegments
} from '@/utils/textStyleUtils';
import { generateId } from '@/utils/storeUtils';

// Export AnyTemplate
export type AnyTemplate = AnimationTemplate | DynamicStyleTemplate | TextStyleTemplate | RichTextStyleTemplate | AdvancedSceneTemplate;
export type TemplateCategory = 'custom' | 'featured' | 'dynamic' | 'static'; // Also export TemplateCategory if needed elsewhere
export const isSceneTemplate = (template: AnyTemplate): template is AdvancedSceneTemplate => 
  template.category === 'scene';

interface TemplateStore {
  activeCategory: TemplateCategory;
  selectedTemplate: AnyTemplate | null;
  customDynamicTemplates: DynamicStyleTemplate[];
  customStaticTemplates: TextStyleTemplate[];
  customRichTextTemplates: RichTextStyleTemplate[];

  setActiveCategory: (category: TemplateCategory) => void;
  selectTemplate: (template: AnyTemplate) => void;
  clearSelection: () => void;

  applyTemplateToSubtitle: (
    subtitleId: string,
    template: AnyTemplate,
    startIndex?: number,
    endIndex?: number
  ) => void;

  removeTemplateFromSubtitle: (
    subtitleId: string,
    template: AnyTemplate,
    startIndex?: number,
    endIndex?: number
  ) => void;

  saveCustomTemplate: (
    segments: RichTextSegment[],
    name: string
  ) => void;

  removeCustomTemplate: (templateId: string) => void;

  getTemplatesByCategory: (category: TemplateCategory) => AnyTemplate[];
}

// Keep type guards internal if not needed outside
const isDynamicTemplate = (template: AnyTemplate): template is DynamicStyleTemplate =>
  (template as DynamicStyleTemplate).animation !== undefined && (template as DynamicStyleTemplate).style !== undefined && !(template as RichTextStyleTemplate).segments;

const isKaraokeTemplate = (template: AnyTemplate): template is DynamicStyleTemplate =>
  (template as DynamicStyleTemplate).karaokeConfig !== undefined;

const isStaticTemplate = (template: AnyTemplate): template is TextStyleTemplate =>
  (template as DynamicStyleTemplate).animation === undefined && (template as DynamicStyleTemplate).style !== undefined && !(template as RichTextStyleTemplate).segments;

const isAnimationTemplate = (template: AnyTemplate): template is AnimationTemplate =>
  (template as AnimationTemplate).effects !== undefined && !(template as RichTextStyleTemplate).segments;

const isRichTextStyleTemplate = (template: AnyTemplate): template is RichTextStyleTemplate =>
  (template as RichTextStyleTemplate).segments !== undefined;


export const useTemplateStore = create<TemplateStore>()(
  immer((set, get) => ({
    activeCategory: 'featured',
    selectedTemplate: null,
    customDynamicTemplates: [],
    customStaticTemplates: [],
    customRichTextTemplates: [],

    setActiveCategory: (category) =>
      set((state) => {
        state.activeCategory = category;
        state.selectedTemplate = null;
      }),

    selectTemplate: (template) =>
      set((state) => {
        state.selectedTemplate = template;
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedTemplate = null;
      }),

  applyTemplateToSubtitle: (subtitleId, template, startIndex?, endIndex?) => {
      const subtitleStore = useSubtitleStore.getState();
      const subtitle = subtitleStore.subtitles.find(s => s.id === subtitleId);
      if (!subtitle) return;

      // 🟢 1. 严格互斥重置：这是解决“切换模板不覆盖参数”的关键
      const cleanState = {
        templateId: undefined,      // 物理清除高级场景 ID
        dynamicConfig: undefined,   // 物理清除动态卡拉OK配置
        style: DEFAULT_SUBTITLE_STYLE,
        // 重新生成不带任何残留样式的纯文本分段
        richText: createRichTextFromPlainText(subtitle.text, DEFAULT_SUBTITLE_STYLE)
      };

      // 处理选区逻辑（用于基础动画/样式应用）
      const hasSelection = startIndex !== undefined && endIndex !== undefined;
      const start = hasSelection ? startIndex : 0;
      const end = hasSelection ? endIndex : subtitle.text.length;

      // 🟢 2. 高级场景模板渲染 (最高优先级，原创轨道)
      if (isSceneTemplate(template)) {
        subtitleStore.updateSubtitle(subtitleId, {
          ...cleanState,
          templateId: template.id,
        });
        return; // 场景模板通过 SubtitleScene 渲染，直接结束
      }

      // 🟢 3. 卡拉OK动态模板 (包含样式 + 动态配置)
      if (isKaraokeTemplate(template)) {
        const finalStyle = { 
          ...DEFAULT_SUBTITLE_STYLE, 
          ...convertTemplateToSubtitleStyle(template.style) 
        };
        subtitleStore.updateSubtitle(subtitleId, {
          ...cleanState,
          dynamicConfig: template.karaokeConfig,
          style: finalStyle,
          richText: createRichTextFromPlainText(subtitle.text, finalStyle)
        });
        return;
      }

      // 🟢 4. 富文本模板 (自定义样式分段)
      if (isRichTextStyleTemplate(template)) {
        if (template.segments.length === 0) return;

        const templateSegments = template.segments;
        const templateLength = templateSegments.length;
        const words = subtitle.text.match(/\S+\s*/g) || [subtitle.text];

        // 将模板分段映射到当前字幕的单词上
        const updatedSegments = words.map((word, index) => {
          const templateSegment = templateSegments[index % templateLength];
          return {
            text: word,
            style: { ...DEFAULT_SUBTITLE_STYLE, ...templateSegment.style },
            animation: templateSegment.animation
          };
        });

        const optimizedSegments = mergeAdjacentSegments(updatedSegments);
        subtitleStore.updateSubtitle(subtitleId, { 
          ...cleanState,
          style: { ...DEFAULT_SUBTITLE_STYLE, ...template.segments[0].style },
          richText: optimizedSegments
        });
        return;
      }

      // 🟢 5. 基础模板与动画 (静态模板、基础动态效果、单一动画)
      let finalStyle = { ...DEFAULT_SUBTITLE_STYLE };
      let currentSegments = [...cleanState.richText];
      let appliedTemplateId: string | undefined = undefined;

      if (isDynamicTemplate(template)) {
        // 动态模板：样式 + 动画
        finalStyle = { ...finalStyle, ...convertTemplateToSubtitleStyle(template.style) };
        const styledSegments = applyStyleToAllSegments(currentSegments, finalStyle);
        currentSegments = applyAnimationToSegments(styledSegments, start, end, template.animation);
      } 
      else if (isStaticTemplate(template)) {
        // 静态模板：仅样式
        finalStyle = { ...finalStyle, ...convertTemplateToSubtitleStyle(template.style) };
        currentSegments = applyStyleToAllSegments(currentSegments, finalStyle);
        appliedTemplateId = template.id;
      } 
      else if (isAnimationTemplate(template) && template.effects.length > 0) {
        // 基础动画：仅应用动画到选区
        currentSegments = applyAnimationToSegments(currentSegments, start, end, template.effects[0]);
      }

      // 最后执行优化合并并更新状态
      const finalOptimizedSegments = mergeAdjacentSegments(currentSegments);
      subtitleStore.updateSubtitle(subtitleId, {
        ...cleanState,
        templateId: appliedTemplateId, 
        style: finalStyle,
        richText: finalOptimizedSegments
      });
    },

    removeTemplateFromSubtitle: (subtitleId, template, startIndex?, endIndex?) => {
      const subtitleStore = useSubtitleStore.getState();
      const subtitle = subtitleStore.subtitles.find(s => s.id === subtitleId);

      if (!subtitle) return;

      let baseSegments = subtitle.richText;
      if (!baseSegments) {
        baseSegments = createRichTextFromPlainText(subtitle.text, subtitle.style);
      }

      const hasSelection = startIndex !== undefined && endIndex !== undefined;
      const start = hasSelection ? startIndex : 0;
      const end = hasSelection ? endIndex : subtitle.text.length;

      let updatedSegments = [...baseSegments];

      const segmentsWithStyleReset = applyStyleToAllSegments(updatedSegments, DEFAULT_SUBTITLE_STYLE);
      updatedSegments = removeAnimationFromSegments(segmentsWithStyleReset, start, end);


      const optimizedSegments = mergeAdjacentSegments(updatedSegments);
      subtitleStore.updateSubtitle(subtitleId, {
        richText: optimizedSegments,
        templateId: undefined,    
        dynamicConfig: undefined  
  });
    },

    saveCustomTemplate: (segments, name) => {
      if (!segments || segments.length === 0) return;

      const newId = `custom-rich-${generateId()}`;
      const previewText = segments.length > 1 ? '多种样式' : '样式';

      const newTemplate: RichTextStyleTemplate = {
        id: newId,
        name: name || `自定义富文本 ${get().customRichTextTemplates.length + 1}`,
        preview: previewText,
        category: 'custom',
        segments: segments.map(seg => ({
          text: "Aa", 
          style: seg.style,
          animation: seg.animation
        })),
      };

      set((state) => {
        state.customRichTextTemplates.push(newTemplate);
      });
    },

    removeCustomTemplate: (templateId) => {
      set((state) => {
        state.customRichTextTemplates = state.customRichTextTemplates.filter(
          (t) => t.id !== templateId
        );
        
        state.customStaticTemplates = state.customStaticTemplates.filter(
          (t) => t.id !== templateId
        );
        
        state.customDynamicTemplates = state.customDynamicTemplates.filter(
          (t) => t.id !== templateId
        );

        if (state.selectedTemplate?.id === templateId) {
          state.selectedTemplate = null;
        }
      });
    },

    getTemplatesByCategory: (category) => {
      switch (category) {
        case 'featured':
          return [
            ...DYNAMIC_STYLE_TEMPLATES.featured,
            ...STATIC_STYLE_TEMPLATES.slice(0, 6) // 取前6个静态
          ];
        case 'static':
          return STATIC_STYLE_TEMPLATES;
        case 'dynamic':
          return [
        ...ADVANCED_SCENE_TEMPLATES,
        ...DYNAMIC_STYLE_TEMPLATES.advanced 
      ];
        case 'custom':
          return get().customRichTextTemplates;
        default:
          return [];
      }
    },
  }))
);

export const useActiveCategory = () =>
  useTemplateStore((state) => state.activeCategory);

export const useSelectedTemplate = () =>
  useTemplateStore((state) => state.selectedTemplate);

// Export type guards if needed elsewhere
export { isDynamicTemplate, isStaticTemplate, isAnimationTemplate, isRichTextStyleTemplate };