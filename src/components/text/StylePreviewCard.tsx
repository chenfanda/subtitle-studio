import { useTextElementStore } from '@/stores/useTextElementStore';
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
  const { addTextElement } = useTextElementStore();
  const { currentTime } = useProjectStore();
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
      // 透传所有新增属性
      backgroundImage: templateStyle.backgroundImage,
      backgroundSize: templateStyle.backgroundSize,
      backgroundRepeat: templateStyle.backgroundRepeat,
      padding: templateStyle.padding,
      borderRadius: templateStyle.borderRadius,
      border: templateStyle.border,
      display: templateStyle.display,
      alignItems: templateStyle.alignItems,
      justifyContent: templateStyle.justifyContent,
      gap: templateStyle.gap,
      icon: templateStyle.icon,
      iconSize: templateStyle.iconSize,
    };
  };
  
  const elementStyle = convertTemplateToSubtitleStyle(template.style);
  // 获取 CSS，但不包含 icon，因为 icon 是 DOM 元素
  const previewCSS = convertStyleToCSS(elementStyle);

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
      style: elementStyle,
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
      className="relative w-full h-16 rounded-lg border-2 border-border-secondary hover:border-accent-purple transition-all duration-200 hover:scale-105 overflow-hidden group bg-bg-secondary"
    >
      {/* 使用 flex 居中，确保内容在卡片中间 */}
      <div className="absolute inset-0 flex items-center justify-center p-1">
        <div 
          style={{
            ...previewCSS,
            // 预览时的特殊覆盖：防止文字太大撑破卡片
            fontSize: template.category === 'basic' ? '18px' : '12px',
            // 如果是图片背景，需要确保它能显示出来
            width: template.style.backgroundImage ? '100%' : 'auto',
            height: template.style.backgroundImage ? '100%' : 'auto',
            // 确保内容不换行
            whiteSpace: 'nowrap',
            // 确保 Flex 布局在预览中生效
            display: template.style.display || (template.style.backgroundImage ? 'flex' : 'block'),
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="select-none pointer-events-none truncate"
        >
          {/* 如果样式中有 icon，在这里渲染 */}
          {template.style.icon && (
            <img 
              src={template.style.icon} 
              alt="icon" 
              style={{
                width: template.style.iconSize || 16, 
                height: template.style.iconSize || 16,
                objectFit: 'contain',
                flexShrink: 0
              }} 
            />
          )}
          <span className="truncate">{template.preview}</span>
        </div>
      </div>
    </button>
  );
}