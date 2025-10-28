import { useState } from 'react';
import { EffectPreviewCard } from './EffectPreviewCard';
import { useTemplateStore } from '@/stores/useTemplateStore';

export function AdvancedEffectsTab() {
  const [isExpanded, setIsExpanded] = useState(false);
  const getTemplatesByCategory = useTemplateStore((state) => state.getTemplatesByCategory);
  
  const templates = getTemplatesByCategory('dynamic');
  const defaultCount = 12;
  const visibleTemplates = isExpanded ? templates : templates.slice(0, defaultCount);
  const hasMore = templates.length > defaultCount;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {visibleTemplates.map((template) => (
          <EffectPreviewCard key={template.id} template={template} />
        ))}
      </div>
      
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 text-sm text-accent-purple hover:text-accent-purple/80 transition-colors"
        >
          {isExpanded ? '收起' : '查看更多'}
        </button>
      )}
    </div>
  );
}