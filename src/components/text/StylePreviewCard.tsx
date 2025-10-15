import { useProjectStore } from '@/stores/useProjectStore';
import { useUIStore } from '@/stores/useUIStore';
import { convertStyleToCSS } from '@/utils/textStyleUtils';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';
import type { TextStyleTemplate } from '@/types/textStyle';
import type { TextElement } from '@/types/textElement';

interface StylePreviewCardProps {
  template: TextStyleTemplate;
}

export function StylePreviewCard({ template }: StylePreviewCardProps) {
  const { addTextElement, currentTime } = useProjectStore();
  const { setSelectedTextElements } = useUIStore();
  
  const convertTemplateToSubtitleStyle = (templateStyle: any) => {
    return {
      ...DEFAULT_SUBTITLE_STYLE,
      fontSize: templateStyle.fontSize || 24,
      fontFamily: templateStyle.fontFamily || 'Arial',
      fontWeight: templateStyle.fontWeight === 'bold' ? 700 : 400,
      fontStyle: templateStyle.fontStyle || 'normal',
      color: templateStyle.color || '#FFFFFF',
      backgroundColor: templateStyle.backgroundColor || 'transparent',
    };
  };
  
  const previewStyle = convertStyleToCSS(convertTemplateToSubtitleStyle(template.style));

  const handleCardClick = () => {
    const newTextElement: Omit<TextElement, 'id'> = {
      type: template.category,
      text: template.preview,
      position: {
        x: 50,
        y: 50,
        scaleX: 1,
        scaleY: 1,
        rotation: 0
      },
      style: convertTemplateToSubtitleStyle(template.style),
      startTime: currentTime * 1000,
      endTime: (currentTime + 5) * 1000,
      layer: Date.now()
    };
    
    const id = addTextElement(newTextElement);
    setSelectedTextElements([id]);
  };

  return (
    <button
      onClick={handleCardClick}
      className="relative w-full h-12 rounded-lg border-2 border-border-secondary hover:border-accent-purple transition-all duration-200 hover:scale-105 overflow-hidden group"
    >
      <div className="absolute inset-0 bg-bg-secondary flex items-center justify-center">
        <div 
          style={previewStyle}
          className="select-none pointer-events-none text-sm font-medium truncate px-2"
        >
          {template.preview}
        </div>
      </div>
    </button>
  );
}