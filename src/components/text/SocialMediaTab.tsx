import { useState } from 'react';
import { StylePreviewCard } from './StylePreviewCard';
import { TEXT_STYLE_TEMPLATES } from '@/constants/textStyleTemplates';

export function SocialMediaTab() {
  const [isExpanded, setIsExpanded] = useState(false);
  const templates = TEXT_STYLE_TEMPLATES.socialMedia;
  const defaultCount = 2;
  const visibleTemplates = isExpanded ? templates : templates.slice(0, defaultCount);
  const hasMore = templates.length > defaultCount;

  return (
    <div className="mb-6">
      <h3 className="text-text-primary font-medium mb-3 px-1">社交媒体</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {visibleTemplates.map((template) => (
          <StylePreviewCard key={template.id} template={template} />
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