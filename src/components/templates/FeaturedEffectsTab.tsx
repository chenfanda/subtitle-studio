import { EffectPreviewCard } from './EffectPreviewCard';
import { TEXT_STYLE_TEMPLATES } from '@/constants/textStyleTemplates';
import { DYNAMIC_STYLE_TEMPLATES } from '@/constants/dynamicStyleTemplates';
import { useUIStore } from '@/stores/useUIStore';
import { useTemplateStore } from '@/stores/useTemplateStore';

export function FeaturedEffectsTab() {
  const setActivePanel = useUIStore((state) => state.setActivePanel);
  const setActiveTemplateCategory = useTemplateStore((state) => state.setActiveCategory);

  const staticTemplates = TEXT_STYLE_TEMPLATES.basic?.slice(0, 6) || [];
  const dynamicTemplates = DYNAMIC_STYLE_TEMPLATES.featured?.slice(0, 6) || [];

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
        <div className="grid grid-cols-3 gap-3">
          {dynamicTemplates.map((template) => (
            <EffectPreviewCard key={template.id} template={template} />
          ))}
        </div>
      </div>
    </div>
  );
}