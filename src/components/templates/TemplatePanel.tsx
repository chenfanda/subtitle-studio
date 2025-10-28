import { CustomEffectsTab } from './CustomEffectsTab';
import { FeaturedEffectsTab } from './FeaturedEffectsTab';
import { AdvancedEffectsTab } from './AdvancedEffectsTab';
import { BasicEffectsTab } from './BasicEffectsTab';
import { useTemplateStore, useActiveCategory } from '@/stores/useTemplateStore';

export function TemplatePanel() {
  const activeCategory = useActiveCategory();
  const { setActiveCategory } = useTemplateStore();

  const categories = [
    { id: 'custom', name: '自定义' },
    { id: 'featured', name: '精选' },
    { id: 'dynamic', name: '动态效果' },
    { id: 'static', name: '基本效果' }
  ] as const;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border-secondary">
        <div className="flex">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id as any)}
              className={`
                flex-1 py-3 px-4 text-sm font-medium transition-colors border-b-2
                ${activeCategory === category.id
                  ? 'text-accent-purple border-accent-purple'
                  : 'text-text-secondary border-transparent hover:text-text-primary'
                }\n              `}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {activeCategory === 'custom' && <CustomEffectsTab />}
        {activeCategory === 'featured' && <FeaturedEffectsTab />}
        {activeCategory === 'dynamic' && <AdvancedEffectsTab />}
        {activeCategory === 'static' && <BasicEffectsTab />}
      </div>
    </div>
  );
}