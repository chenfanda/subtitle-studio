import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AnimationCategory, AnimationTemplate, AnimationEffect } from '@/types/animation';
import { ANIMATION_TEMPLATES } from '@/constants/animationTemplates';
import { useProjectStore } from '@/stores/useProjectStore';
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
        
        const updatedSegments = applyAnimationToSegments(
          richTextSegments,
          startIndex,
          endIndex,
          animationEffect
        );
        
        const optimizedSegments = mergeAdjacentSegments(updatedSegments);
        projectStore.updateSubtitleRichText(subtitleId, optimizedSegments);
        
      } else {
        // 应用到整个字幕
        let richTextSegments = subtitle.richText;
        
        if (!richTextSegments) {
          // 创建富文本数据
          richTextSegments = createRichTextFromPlainText(subtitle.text, subtitle.style);
        }
        
        // 应用动效到所有片段，保留各片段的样式
        const updatedSegments = richTextSegments.map(segment => ({
          ...segment,
          style: segment.style, // 保留原有样式
          animation: { ...animationEffect }
        }));
        
        const optimizedSegments = mergeAdjacentSegments(updatedSegments);
        projectStore.updateSubtitleRichText(subtitleId, optimizedSegments);
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