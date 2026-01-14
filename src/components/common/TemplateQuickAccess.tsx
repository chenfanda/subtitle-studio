import { useUIStore } from '@/stores/useUIStore';
import { useTemplateStore } from '@/stores/useTemplateStore';
import { EffectPreviewCard } from '@/components/templates/EffectPreviewCard'; 
import { ADVANCED_SCENE_TEMPLATES } from '@/constants/advancedTemplates'; 

interface TemplateQuickAccessProps {
  targetType: 'subtitle' | 'textElement';
  targetId: string;
}

export function TemplateQuickAccess({ targetType, targetId }: TemplateQuickAccessProps) {
  const setActivePanel = useUIStore((state) => state.setActivePanel);
  const setActiveTemplateCategory = useTemplateStore((state) => state.setActiveCategory);
  // const getTemplatesByCategory = useTemplateStore((state) => state.getTemplatesByCategory);

  // Get first 2 featured (dynamic) templates
  const featuredTemplates = ADVANCED_SCENE_TEMPLATES.slice(0, 2);
  // const featuredTemplates = getTemplatesByCategory('featured').slice(0, 2);

  const handleViewMore = () => {
    setActivePanel('templates');
    setActiveTemplateCategory('dynamic');
  };

  // Only show for subtitles and if templates exist
  if (targetType !== 'subtitle' || featuredTemplates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-text-primary">精选模板</h3>
        <button
          onClick={handleViewMore}
          className="text-xs font-medium text-accent-purple hover:text-accent-purple/80 transition-colors"
        >
          查看更多
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {featuredTemplates.map(template => (
          <EffectPreviewCard
            key={template.id}
            template={template}
            targetSubtitleId={targetId} // Pass targetId here
          />
        ))}
      </div>
    </div>
  );
}