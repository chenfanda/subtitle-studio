import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TextStyleCategory, TextStyleTemplate, TextStyleConfig } from '@/types/textStyle';
import { TEXT_STYLE_TEMPLATES } from '@/constants/textStyleTemplates';
import { useProjectStore } from '@/stores/useProjectStore';
import { 
  applyStyleToAllSegments, 
  applyStyleToSegments, 
  createRichTextFromPlainText,
  mergeAdjacentSegments
} from '@/utils/textStyleUtils';

const convertToSubtitleShadow = (textShadow?: TextStyleConfig['shadow']) => ({
  enabled: !!textShadow,
  color: textShadow?.color || '#000000',
  offsetX: textShadow?.offsetX || 2,
  offsetY: textShadow?.offsetY || 2,
  blur: textShadow?.blur || 0,
});

interface TextStyleStore {
  activeCategory: TextStyleCategory;
  selectedTemplate: TextStyleTemplate | null;
  
  setActiveCategory: (category: TextStyleCategory) => void;
  selectTemplate: (template: TextStyleTemplate) => void;
  clearSelection: () => void;
  applyToRange: (subtitleId: string, startIndex?: number, endIndex?: number) => void;
  getTemplatesByCategory: (category: TextStyleCategory) => TextStyleTemplate[];
}

export const useTextStyleStore = create<TextStyleStore>()(
  immer((set, get) => ({
    activeCategory: 'basic',
    selectedTemplate: null,
    
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
    
    applyToRange: (subtitleId, startIndex?, endIndex?) => {
      const { selectedTemplate } = get();
      if (!selectedTemplate) return;
      
      const subtitleStyle = {
        fontSize: selectedTemplate.style.fontSize,
        fontFamily: selectedTemplate.style.fontFamily,
        fontWeight: selectedTemplate.style.fontWeight,
        fontStyle: selectedTemplate.style.fontStyle,
        color: selectedTemplate.style.color,
        backgroundColor: selectedTemplate.style.backgroundColor,
        position: 'bottom' as const,
        alignment: selectedTemplate.style.textAlign || 'center' as const,
        opacity: 1,
        shadow: convertToSubtitleShadow(selectedTemplate.style.shadow),
      };
      
      const projectStore = useProjectStore.getState();
      const subtitle = projectStore.subtitles.find(s => s.id === subtitleId);
      
      if (!subtitle) return;
      
      // 统一范围应用逻辑
      if (startIndex !== undefined && endIndex !== undefined) {
        // 应用到指定范围
        let richTextSegments = subtitle.richText;
        
        if (!richTextSegments) {
          // 创建富文本数据
          richTextSegments = createRichTextFromPlainText(subtitle.text, subtitle.style);
        }
        
        const updatedSegments = applyStyleToSegments(
          richTextSegments, 
          startIndex, 
          endIndex, 
          subtitleStyle
        );
        
        const optimizedSegments = mergeAdjacentSegments(updatedSegments);
        projectStore.updateSubtitleRichText(subtitleId, optimizedSegments);
        
      } else {
        // 应用到整个字幕
        if (subtitle.richText) {
          // 有富文本数据，应用到所有片段
          const updatedSegments = applyStyleToAllSegments(subtitle.richText, subtitleStyle);
          projectStore.updateSubtitleRichText(subtitleId, updatedSegments);
        } else {
          // 没有富文本数据，直接更新字幕样式
          projectStore.updateSubtitle(subtitleId, { style: subtitleStyle });
        }
      }
    },
    
    getTemplatesByCategory: (category) => {
      return TEXT_STYLE_TEMPLATES[category] || [];
    },
  }))
);

export const useActiveCategory = () => 
  useTextStyleStore((state) => state.activeCategory);

export const useSelectedTemplate = () => 
  useTextStyleStore((state) => state.selectedTemplate);

export const useTemplatesByActiveCategory = () => {
  const activeCategory = useTextStyleStore((state) => state.activeCategory);
  const getTemplatesByCategory = useTextStyleStore((state) => state.getTemplatesByCategory);
  return getTemplatesByCategory(activeCategory);
};