import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AnimationCategory, AnimationTemplate, AnimationEffect } from '@/types/animation';
import { ANIMATION_TEMPLATES } from '@/constants/animationTemplates';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { 
  applyAnimationToSegments,
  createRichTextFromPlainText,
  mergeAdjacentSegments
} from '@/utils/textStyleUtils';

interface TemplateStore {
  activeCategory: AnimationCategory;
  selectedTemplate: AnimationTemplate | null;
  
  setActiveCategory: (category: AnimationCategory) => void;
  selectTemplate: (template: AnimationTemplate) => void;
  clearSelection: () => void;
  applyAnimationToRange: (subtitleId: string, animationEffect: AnimationEffect, startIndex?: number, endIndex?: number) => void;
  getTemplatesByCategory: (category: AnimationCategory) => AnimationTemplate[];
}

export const useTemplateStore = create<TemplateStore>()(
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
    
    applyAnimationToRange: (subtitleId, animationEffect, startIndex?, endIndex?) => {
      const subtitleStore = useSubtitleStore.getState();
      const subtitle = subtitleStore.subtitles.find(s => s.id === subtitleId);
      
      if (!subtitle) return;
      
      if (startIndex !== undefined && endIndex !== undefined) {
        let richTextSegments = subtitle.richText;
        
        if (!richTextSegments) {
          richTextSegments = createRichTextFromPlainText(subtitle.text, subtitle.style);
        }
        
        const updatedSegments = applyAnimationToSegments(
          richTextSegments,
          startIndex,
          endIndex,
          animationEffect
        );
        
        const optimizedSegments = mergeAdjacentSegments(updatedSegments);
        subtitleStore.updateSubtitleRichText(subtitleId, optimizedSegments);
        
      } else {
        let richTextSegments = subtitle.richText;
        
        if (!richTextSegments) {
          richTextSegments = createRichTextFromPlainText(subtitle.text, subtitle.style);
        }
        
        const updatedSegments = richTextSegments.map(segment => ({
          ...segment,
          style: segment.style,
          animation: { ...animationEffect }
        }));
        
        const optimizedSegments = mergeAdjacentSegments(updatedSegments);
        subtitleStore.updateSubtitleRichText(subtitleId, optimizedSegments);
      }
    },
    
    getTemplatesByCategory: (category) => {
      return ANIMATION_TEMPLATES[category] || [];
    },
  }))
);

export const useActiveCategory = () => 
  useTemplateStore((state) => state.activeCategory);

export const useSelectedTemplate = () => 
  useTemplateStore((state) => state.selectedTemplate);