import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { SubtitleStyle, RichTextSegment } from '@/types/subtitle';
import type {
  AnimationTemplate,
  AnimationEffect,
  DynamicStyleTemplate,
  RichTextStyleTemplate
} from '@/types/animation';
import type { TextStyleTemplate, TextStyleCategory } from '@/types/textStyle';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';
import { ANIMATION_TEMPLATES } from '@/constants/animationTemplates';
import { DYNAMIC_STYLE_TEMPLATES } from '@/constants/dynamicStyleTemplates';
import { TEXT_STYLE_TEMPLATES } from '@/constants/textStyleTemplates';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import {
  applyAnimationToSegments,
  applyStyleToAllSegments,
  convertTemplateToSubtitleStyle,
  convertSubtitleStyleToTemplate,
  createRichTextFromPlainText,
  mergeAdjacentSegments,
  removeAnimationFromSegments
} from '@/utils/textStyleUtils';
import { generateId } from '@/utils/storeUtils';

// Export AnyTemplate
export type AnyTemplate = AnimationTemplate | DynamicStyleTemplate | TextStyleTemplate | RichTextStyleTemplate;
export type TemplateCategory = 'custom' | 'featured' | 'dynamic' | 'static'; // Also export TemplateCategory if needed elsewhere

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

      let baseSegments = subtitle.richText;
      if (!baseSegments) {
        baseSegments = createRichTextFromPlainText(subtitle.text, subtitle.style);
      }

      const hasSelection = startIndex !== undefined && endIndex !== undefined;
      const start = hasSelection ? startIndex : 0;
      const end = hasSelection ? endIndex : subtitle.text.length;

      let updatedSegments = [...baseSegments];

      if (isRichTextStyleTemplate(template)) {
        if (template.segments.length === 0) return;

        const templateSegments = template.segments;
        const templateLength = templateSegments.length;

        // 1. Get the full plain text from the target subtitle's existing segments.
        const fullText = baseSegments.map(seg => seg.text).join('');
        
        // 2. Split the full text into words + trailing spaces/punctuation.
        // This regex (\S+\s*) splits "Hello world!" into ["Hello ", "world!"]
        const words = fullText.match(/\S+\s*/g) || [fullText];

        // 3. Create new segments by applying template styles cyclically to the words.
        updatedSegments = words.map((word, index) => {
          const templateSegment = templateSegments[index % templateLength];
          return {
            text: word,
            style: { ...DEFAULT_SUBTITLE_STYLE, ...templateSegment.style },
            animation: templateSegment.animation
          };
        });
        
        const firstSegmentStyle = template.segments[0]?.style || DEFAULT_SUBTITLE_STYLE;
        subtitleStore.updateSubtitle(subtitleId, { style: firstSegmentStyle });
      }
      else if (isDynamicTemplate(template)) {
        const convertedStyle = convertTemplateToSubtitleStyle(template.style);
        const segmentsWithStyle = applyStyleToAllSegments(updatedSegments, convertedStyle);
        updatedSegments = applyAnimationToSegments(segmentsWithStyle, start, end, template.animation);

      } else if (isStaticTemplate(template)) {
        const convertedStyle = convertTemplateToSubtitleStyle(template.style);
        updatedSegments = applyStyleToAllSegments(updatedSegments, convertedStyle);

      } else if (isAnimationTemplate(template) && template.effects.length > 0) {
        updatedSegments = applyAnimationToSegments(updatedSegments, start, end, template.effects[0]);
      }

      const optimizedSegments = mergeAdjacentSegments(updatedSegments);
      subtitleStore.updateSubtitleRichText(subtitleId, optimizedSegments);
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
      subtitleStore.updateSubtitleRichText(subtitleId, optimizedSegments);
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
      const { customDynamicTemplates, customStaticTemplates, customRichTextTemplates } = get();
      switch (category) {
        case 'featured':
          return DYNAMIC_STYLE_TEMPLATES.featured || [];
        case 'static':
          return Object.values(TEXT_STYLE_TEMPLATES).flat();
        case 'dynamic':
          return [
            ...(DYNAMIC_STYLE_TEMPLATES.featured || []),
            ...(DYNAMIC_STYLE_TEMPLATES.advanced || []),
            ...(ANIMATION_TEMPLATES.featured || []),
            ...(ANIMATION_TEMPLATES.advanced || []),
            ...(ANIMATION_TEMPLATES.basic || [])
          ];
        case 'custom':
           return [
            ...customRichTextTemplates,
            ...customStaticTemplates,
            ...customDynamicTemplates,
            ...(DYNAMIC_STYLE_TEMPLATES.custom || []),
            ...(ANIMATION_TEMPLATES.custom || [])
          ];
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