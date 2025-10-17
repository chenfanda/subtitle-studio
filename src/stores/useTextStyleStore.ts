import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TextStyleCategory, TextStyleTemplate, TextStyleConfig } from '@/types/textStyle';
import { TEXT_STYLE_TEMPLATES } from '@/constants/textStyleTemplates';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
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

const convertFontWeight = (weight: string | number): number => {
  if (typeof weight === 'number') return weight;
  
  const weightMap: Record<string, number> = {
    'normal': 400,
    'bold': 700,
    'bolder': 900,
    'lighter': 300
  };
  
  return weightMap[weight] || 400;
};

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
        fontWeight: convertFontWeight(selectedTemplate.style.fontWeight),
        fontStyle: selectedTemplate.style.fontStyle,
        color: selectedTemplate.style.color,
        backgroundColor: selectedTemplate.style.backgroundColor || 'transparent',
        position: 'bottom' as const,
        alignment: selectedTemplate.style.textAlign || 'center' as const,
        opacity: 1,
        shadow: convertToSubtitleShadow(selectedTemplate.style.shadow),
      };
      
      const subtitleStore = useSubtitleStore.getState();
      const subtitle = subtitleStore.subtitles.find(s => s.id === subtitleId);
      
      if (!subtitle) return;
      
      if (startIndex !== undefined && endIndex !== undefined) {
        let richTextSegments = subtitle.richText;
        
        if (!richTextSegments) {
          richTextSegments = createRichTextFromPlainText(subtitle.text, subtitle.style);
        }
        
        const updatedSegments = applyStyleToSegments(
          richTextSegments, 
          startIndex, 
          endIndex, 
          subtitleStyle
        );
        
        const optimizedSegments = mergeAdjacentSegments(updatedSegments);
        subtitleStore.updateSubtitleRichText(subtitleId, optimizedSegments);
        
      } else {
        if (subtitle.richText) {
          const updatedSegments = applyStyleToAllSegments(subtitle.richText, subtitleStyle);
          subtitleStore.updateSubtitleRichText(subtitleId, updatedSegments);
        } else {
          subtitleStore.updateSubtitle(subtitleId, { style: subtitleStyle });
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