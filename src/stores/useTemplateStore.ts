import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AnimationCategory, AnimationTemplate, AnimationEffect } from '@/types/animation';
import { ANIMATION_TEMPLATES } from '@/constants/animationTemplates';
import { useProjectStore } from './useProjectStore';

interface TemplateStore {
  // 状态
  activeCategory: AnimationCategory;
  selectedTemplate: AnimationTemplate | null;
  isPreviewPlaying: boolean;
  
  // 方法
  setActiveCategory: (category: AnimationCategory) => void;
  selectTemplate: (template: AnimationTemplate) => void;
  clearSelection: () => void;
  applyToSubtitle: (subtitleId: string) => void;
  getTemplatesByCategory: (category: AnimationCategory) => AnimationTemplate[];
  
  // 预览控制
  startPreview: () => void;
  stopPreview: () => void;
  
  // 自定义模板管理
  createCustomTemplate: (name: string, effects: AnimationEffect[]) => void;
  deleteCustomTemplate: (templateId: string) => void;
}

export const useTemplateStore = create<TemplateStore>()(
  immer((set, get) => ({
    // 初始状态
    activeCategory: 'basic',
    selectedTemplate: null,
    isPreviewPlaying: false,
    
    // 切换动效分类
    setActiveCategory: (category) => 
      set((state) => {
        state.activeCategory = category;
        state.selectedTemplate = null; // 切换分类时清除选择
        state.isPreviewPlaying = false; // 停止预览
      }),
    
    // 选择动效模板
    selectTemplate: (template) => 
      set((state) => {
        state.selectedTemplate = template;
        state.isPreviewPlaying = false; // 重新选择时停止预览
      }),
    
    // 清除选择
    clearSelection: () => 
      set((state) => {
        state.selectedTemplate = null;
        state.isPreviewPlaying = false;
      }),
    
    // 应用动效到字幕
    applyToSubtitle: (subtitleId) => {
      const { selectedTemplate } = get();
      if (!selectedTemplate) return;
      
      // 将动效模板转换为字幕动画效果
      const animations = selectedTemplate.effects.map(effect => ({
        ...effect,
        // 确保动画效果的时间配置适合字幕播放
        delay: effect.delay || 0,
        easing: effect.easing || 'ease'
      }));
      
      // 调用项目Store更新字幕动画
      useProjectStore.getState().updateSubtitle(subtitleId, { 
        animations 
      });
    },
    
    // 获取指定分类的模板列表
    getTemplatesByCategory: (category) => {
      return ANIMATION_TEMPLATES[category] || [];
    },
    
    // 开始预览
    startPreview: () => 
      set((state) => {
        if (state.selectedTemplate) {
          state.isPreviewPlaying = true;
        }
      }),
    
    // 停止预览
    stopPreview: () => 
      set((state) => {
        state.isPreviewPlaying = false;
      }),
    
    // 创建自定义模板
    createCustomTemplate: (name, effects) => 
      set((state) => {
        const customTemplate: AnimationTemplate = {
          id: `custom_${Date.now()}`,
          name,
          preview: name,
          category: 'custom',
          effects
        };
        
        // 添加到自定义分类
        if (!ANIMATION_TEMPLATES.custom) {
          ANIMATION_TEMPLATES.custom = [];
        }
        ANIMATION_TEMPLATES.custom.push(customTemplate);
        
        // 自动选择新创建的模板
        state.selectedTemplate = customTemplate;
        state.activeCategory = 'custom';
      }),
    
    // 删除自定义模板
    deleteCustomTemplate: (templateId) => 
      set((state) => {
        if (ANIMATION_TEMPLATES.custom) {
          ANIMATION_TEMPLATES.custom = ANIMATION_TEMPLATES.custom.filter(
            template => template.id !== templateId
          );
        }
        
        // 如果删除的是当前选中的模板，清除选择
        if (state.selectedTemplate?.id === templateId) {
          state.selectedTemplate = null;
          state.isPreviewPlaying = false;
        }
      }),
  }))
);

// 便捷选择器
export const useActiveCategory = () => 
  useTemplateStore((state) => state.activeCategory);

export const useSelectedTemplate = () => 
  useTemplateStore((state) => state.selectedTemplate);

export const useIsPreviewPlaying = () => 
  useTemplateStore((state) => state.isPreviewPlaying);

export const useTemplatesByActiveCategory = () => {
  const activeCategory = useTemplateStore((state) => state.activeCategory);
  const getTemplatesByCategory = useTemplateStore((state) => state.getTemplatesByCategory);
  return getTemplatesByCategory(activeCategory);
};