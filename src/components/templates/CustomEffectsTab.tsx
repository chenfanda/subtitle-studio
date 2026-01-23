import { useState } from 'react';
import { EffectPreviewCard } from './EffectPreviewCard';
import { useTemplateStore } from '@/stores/useTemplateStore';
import { useTranslation } from '@/hooks/useTranslation';

export function CustomEffectsTab() {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const getTemplatesByCategory = useTemplateStore((state) => state.getTemplatesByCategory);

  const templates = getTemplatesByCategory('custom');
  const defaultCount = 6;
  const visibleTemplates = isExpanded ? templates : templates.slice(0, defaultCount);
  const hasMore = templates.length > defaultCount;

  return (
    <div className="space-y-4">
      {templates.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">
          <p className="mb-2">{t('暂无自定义动效')}</p>
          <p className="text-xs text-text-tertiary">{t('创建您的专属动效模板')}</p>
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
              {isExpanded ? t('收起') : t('查看更多')}
            </button>
          )}
        </>
      )}
    </div>
  );
}