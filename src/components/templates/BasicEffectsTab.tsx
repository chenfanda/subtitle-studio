import { useState } from 'react';
import { EffectPreviewCard } from './EffectPreviewCard';
import { useTemplateStore } from '@/stores/useTemplateStore';
import { useTranslation } from '@/hooks/useTranslation';

export function BasicEffectsTab() {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const getTemplatesByCategory = useTemplateStore((state) => state.getTemplatesByCategory);

  const templates = getTemplatesByCategory('static');
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
          {isExpanded ? t('收起') : t('查看更多')}
        </button>
      )}
    </div>
  );
}