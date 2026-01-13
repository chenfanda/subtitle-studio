import { EffectPreviewCard } from './EffectPreviewCard';
import { TEXT_STYLE_TEMPLATES } from '@/constants/textStyleTemplates';
import { DYNAMIC_STYLE_TEMPLATES } from '@/constants/dynamicStyleTemplates';
import { ADVANCED_SCENE_TEMPLATES } from '@/constants/advancedTemplates';
import { useUIStore } from '@/stores/useUIStore';
import { useTemplateStore } from '@/stores/useTemplateStore';
import { useMemo } from 'react';

export function FeaturedEffectsTab() {
  const setActivePanel = useUIStore((state) => state.setActivePanel);
  const setActiveTemplateCategory = useTemplateStore((state) => state.setActiveCategory);

  const staticTemplates = TEXT_STYLE_TEMPLATES.basic?.slice(0, 6) || [];
  
  
  const featuredDynamic = useMemo(() => {
    // 1. 找到圣诞和新春模板
    const christmas = ADVANCED_SCENE_TEMPLATES.find(t => t.id === 'scene-christmas-01');
    const newYear = ADVANCED_SCENE_TEMPLATES.find(t => t.id === 'scene-new-year-01');
    
    // 2. 找到其他普通动态模板作为补充
    const otherDynamics = DYNAMIC_STYLE_TEMPLATES.featured.slice(0, 2);

    // 组合在一起 (过滤掉 undefined)
    return [christmas, newYear, ...otherDynamics].filter(Boolean);
  }, []);

  const handleViewMoreStatic = () => {
    setActivePanel('templates');
    setActiveTemplateCategory('static'); 
  };
  
  const handleViewMoreDynamic = () => {
    setActivePanel('templates');
    setActiveTemplateCategory('dynamic');
  };

  return (
    <div className="space-y-6">
      {/* 动态效果板块 - 统一使用 2 列布局以兼容场景模板的显示 */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-text-primary">动态效果</h3>
          <button
            onClick={handleViewMoreDynamic}
            className="text-xs font-medium text-accent-purple hover:text-accent-purple/80 transition-colors"
          >
            查看更多
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {featuredDynamic.map((template) => (
            template && <EffectPreviewCard key={template.id} template={template} />
          ))}
        </div>
      </div>

      {/* 基本效果板块 - 保持 3 列布局 */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-text-primary">基本</h3>
          <button
            onClick={handleViewMoreStatic}
            className="text-xs font-medium text-accent-purple hover:text-accent-purple/80 transition-colors"
          >
            查看更多
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {staticTemplates.map((template) => (
            <EffectPreviewCard key={template.id} template={template} />
          ))}
        </div>
      </div>
    </div>
  );
}