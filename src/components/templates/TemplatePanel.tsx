import { CustomEffectsTab } from './CustomEffectsTab';
import { FeaturedEffectsTab } from './FeaturedEffectsTab';
import { AdvancedEffectsTab } from './AdvancedEffectsTab';
import { BasicEffectsTab } from './BasicEffectsTab';
import { AnimationPreview } from './AnimationPreview';
import { useTemplateStore, useSelectedTemplate, useActiveCategory } from '@/stores/useTemplateStore';
import { useSelectedSubtitles } from '@/stores/useUIStore';

export function TemplatePanel() {
  const selectedTemplate = useSelectedTemplate();
  const activeCategory = useActiveCategory();
  const selectedSubtitleIds = useSelectedSubtitles();
  const { setActiveCategory, applyToSubtitle } = useTemplateStore();
  
  const hasSelection = selectedTemplate && selectedSubtitleIds.length > 0;

  const categories = [
    { id: 'custom', name: '自定义' },
    { id: 'featured', name: '精选' },
    { id: 'advanced', name: '高级' },
    { id: 'basic', name: '基本' }
  ] as const;

  const handleApply = () => {
    if (!selectedTemplate || selectedSubtitleIds.length === 0) return;
    
    selectedSubtitleIds.forEach(subtitleId => {
      applyToSubtitle(subtitleId);
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border-secondary">
        <AnimationPreview />
      </div>
      
      <div className="border-b border-border-secondary">
        <div className="flex">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`
                flex-1 py-3 px-4 text-sm font-medium transition-colors border-b-2
                ${activeCategory === category.id
                  ? 'text-accent-purple border-accent-purple'
                  : 'text-text-secondary border-transparent hover:text-text-primary'
                }
              `}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {activeCategory === 'custom' && <CustomEffectsTab />}
        {activeCategory === 'featured' && <FeaturedEffectsTab />}
        {activeCategory === 'advanced' && <AdvancedEffectsTab />}
        {activeCategory === 'basic' && <BasicEffectsTab />}
      </div>
      
      <div className="border-t border-border-secondary p-4">
        <button
          onClick={handleApply}
          disabled={!hasSelection}
          className={`
            w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
            ${hasSelection
              ? 'bg-accent-purple text-white hover:bg-accent-purple/90 shadow-lg'
              : 'bg-bg-tertiary text-text-secondary cursor-not-allowed'
            }
          `}
        >
          应用到选中字幕 ({selectedSubtitleIds.length})
        </button>
      </div>
    </div>
  );
}