import { useTemplateStore, useSelectedTemplate } from '@/stores/useTemplateStore';
import type { AnimationTemplate } from '@/types/animation';

interface EffectPreviewCardProps {
  template: AnimationTemplate;
}

export function EffectPreviewCard({ template }: EffectPreviewCardProps) {
  const selectedTemplate = useSelectedTemplate();
  const selectTemplate = useTemplateStore((state) => state.selectTemplate);
  
  const isSelected = selectedTemplate?.id === template.id;

  return (
    <button
      onClick={() => selectTemplate(template)}
      className={`
        relative w-full h-20 rounded-lg border-2 transition-all duration-200
        hover:scale-105 overflow-hidden group
        ${isSelected 
          ? 'border-accent-purple shadow-lg shadow-accent-purple/20' 
          : 'border-border-secondary hover:border-border-primary'
        }
      `}
    >
      <div className="absolute inset-0 bg-bg-secondary flex items-center justify-center">
        <div className="text-sm font-medium text-text-primary truncate px-2">
          {template.preview}
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-accent-purple rounded-full" />
      )}
    </button>
  );
}