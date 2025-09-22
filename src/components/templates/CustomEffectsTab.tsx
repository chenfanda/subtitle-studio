import { useState } from 'react';
import { EffectPreviewCard } from './EffectPreviewCard';
import { useTemplateStore } from '@/stores/useTemplateStore';

export function CustomEffectsTab() {
  const [isExpanded, setIsExpanded] = useState(false);
  const getTemplatesByCategory = useTemplateStore((state) => state.getTemplatesByCategory);
  
  const templates = getTemplatesByCategory('custom');
  const defaultCount = 6;
  const visibleTemplates = isExpanded ? templates : templates.slice(0, defaultCount);
  const hasMore = templates.length > defaultCount;

  return (
    <div className="space-y-4">
      {templates.length === 0 ? (
        <div className="text-center py-8 text-text-tertiary">
          <div className="text-2xl mb-2">✨</div>
          <div className="text-sm">暂无自定义动效</div>
          <div className="text-xs mt-1">创建您的专属动效模板</div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}