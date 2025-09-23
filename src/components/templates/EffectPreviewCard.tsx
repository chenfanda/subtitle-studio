import { useEffect, useRef, useState } from 'react';
import { useTemplateStore, useSelectedTemplate } from '@/stores/useTemplateStore';
import { useSelectedSubtitles } from '@/stores/useUIStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { convertToWebAnimation } from '@/utils/animationUtils';
import { applyAnimationToSegments, mergeAdjacentSegments } from '@/utils/textStyleUtils';
import type { AnimationTemplate } from '@/types/animation';

interface EffectPreviewCardProps {
  template: AnimationTemplate;
}

export function EffectPreviewCard({ template }: EffectPreviewCardProps) {
  const selectedTemplate = useSelectedTemplate();
  const selectTemplate = useTemplateStore((state) => state.selectTemplate);
  const selectedSubtitleIds = useSelectedSubtitles();
  const { subtitles, updateSubtitleRichText } = useProjectStore();
  
  const previewRef = useRef<HTMLDivElement>(null);
  const [animation, setAnimation] = useState<Animation | null>(null);
  
  const isSelected = selectedTemplate?.id === template.id;
  const hasSelectedSubtitles = selectedSubtitleIds.length > 0;
  
  const selectedSubtitle = hasSelectedSubtitles 
    ? subtitles.find(s => s.id === selectedSubtitleIds[0])
    : null;
  
  const previewText = selectedSubtitle?.text || template.preview;
  const previewStyle = selectedSubtitle?.style;

  useEffect(() => {
    if (isSelected && previewRef.current) {
      playAnimation();
    } else {
      stopAnimation();
    }

    return () => stopAnimation();
  }, [isSelected, selectedSubtitle]);

  const playAnimation = () => {
    if (!template.effects.length || !previewRef.current) return;

    const element = previewRef.current;
    const primaryEffect = template.effects[0];
    const keyframes = convertToWebAnimation(primaryEffect);
    
    const options: KeyframeAnimationOptions = {
      duration: primaryEffect.duration,
      easing: primaryEffect.easing || 'ease',
      iterations: primaryEffect.type === 'continuous' ? Infinity : 1,
      fill: 'both'
    };

    const newAnimation = element.animate(keyframes, options);
    setAnimation(newAnimation);

    if (primaryEffect.type !== 'continuous') {
      newAnimation.onfinish = () => {
        setTimeout(() => {
          if (isSelected) {
            playAnimation();
          }
        }, 500);
      };
    }
  };

  const stopAnimation = () => {
    if (animation) {
      animation.cancel();
      setAnimation(null);
    }
  };

  const handleCardClick = () => {
    selectTemplate(template);
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!template.effects.length) return;
    
    const primaryEffect = template.effects[0];
    
    selectedSubtitleIds.forEach(subtitleId => {
      const subtitle = subtitles.find(s => s.id === subtitleId);
      if (!subtitle) return;
      
      // 获取当前字幕的富文本数据
      let richTextSegments = subtitle.richText;
      if (!richTextSegments) {
        // 如果没有富文本，从纯文本创建
        richTextSegments = [{
          text: subtitle.text,
          style: subtitle.style,
          animation: undefined
        }];
      }
      
      // 应用动效到整个字幕（所有片段）
      const updatedSegments = richTextSegments.map(segment => ({
        ...segment,
        animation: { ...primaryEffect }
      }));
      
      const optimizedSegments = mergeAdjacentSegments(updatedSegments);
      
      // 更新字幕
      updateSubtitleRichText(subtitleId, optimizedSegments);
    });
  };

  return (
    <button
      onClick={handleCardClick}
      className={`
        relative w-full h-24 rounded-lg border-2 transition-all duration-200
        hover:scale-105 overflow-hidden group
        ${isSelected 
          ? 'border-accent-purple shadow-lg shadow-accent-purple/20' 
          : 'border-border-secondary hover:border-border-primary'
        }
      `}
    >
      <div className="absolute inset-0 bg-bg-secondary flex items-center justify-center p-2">
        <div 
          ref={previewRef}
          className="text-sm font-medium text-text-primary truncate"
          style={{
            fontFamily: previewStyle?.fontFamily || 'inherit',
            fontSize: previewStyle?.fontSize ? `${Math.min(previewStyle.fontSize, 14)}px` : '14px',
            color: previewStyle?.color || '#ffffff',
            textShadow: previewStyle?.shadow?.enabled 
              ? `${previewStyle.shadow.offsetX}px ${previewStyle.shadow.offsetY}px ${previewStyle.shadow.blur}px ${previewStyle.shadow.color}`
              : 'none'
          }}
        >
          {previewText}
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-accent-purple rounded-full" />
      )}
      
      {isSelected && hasSelectedSubtitles && (
        <div className="absolute bottom-1 left-1 right-1">
          <button
            onClick={handleApply}
            className="w-full py-1 px-2 text-xs bg-accent-purple hover:bg-accent-purple/80 text-white rounded transition-colors"
          >
            应用到整个字幕
          </button>
        </div>
      )}
      
      {isSelected && !hasSelectedSubtitles && (
        <div className="absolute bottom-1 left-1 right-1">
          <div className="w-full py-1 px-2 text-xs bg-gray-600 text-gray-300 rounded text-center">
            请先选择字幕
          </div>
        </div>
      )}
    </button>
  );
}