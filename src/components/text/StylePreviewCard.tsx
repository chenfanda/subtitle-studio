import { useTextStyleStore, useSelectedTemplate } from '@/stores/useTextStyleStore';
import { convertStyleToCSS } from '@/utils/textStyleUtils';
import type { TextStyleTemplate } from '@/types/textStyle';

interface StylePreviewCardProps {
  template: TextStyleTemplate;
}

export function StylePreviewCard({ template }: StylePreviewCardProps) {
  const selectedTemplate = useSelectedTemplate();
  const selectTemplate = useTextStyleStore((state) => state.selectTemplate);
  
  const isSelected = selectedTemplate?.id === template.id;
  const previewStyle = convertStyleToCSS(template.style);

  return (
    <button
      onClick={() => selectTemplate(template)}
      className={`
        relative w-full h-12 rounded-lg border-2 transition-all duration-200
        hover:scale-105 overflow-hidden group
        ${isSelected 
          ? 'border-accent-purple shadow-lg shadow-accent-purple/20' 
          : 'border-border-secondary hover:border-border-primary'
        }
      `}
    >
      <div className="absolute inset-0 bg-bg-secondary flex items-center justify-center">
        <div 
          style={previewStyle}
          className="select-none pointer-events-none text-sm font-medium truncate px-2"
        >
          {template.preview}
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-accent-purple rounded-full" />
      )}
    </button>
  );
}