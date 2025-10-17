import { useEffect, useRef, useState } from 'react';
import { useTemplateStore, useSelectedTemplate } from '@/stores/useTemplateStore';
import { useSelectedSubtitles, useRichTextSelection } from '@/stores/useUIStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { convertToWebAnimation } from '@/utils/animationUtils';
import { convertRichTextToPlainText } from '@/utils/textStyleUtils';
import type { AnimationTemplate } from '@/types/animation';

interface EffectPreviewCardProps {
  template: AnimationTemplate;
}

export function EffectPreviewCard({ template }: EffectPreviewCardProps) {
  const selectedTemplate = useSelectedTemplate();
  const selectTemplate = useTemplateStore((state) => state.selectTemplate);
  const applyAnimationToRange = useTemplateStore((state) => state.applyAnimationToRange);
  const selectedSubtitleIds = useSelectedSubtitles();
  const richTextSelection = useRichTextSelection();
  const { subtitles, updateSubtitleRichText } = useSubtitleStore();
  
  const previewRef = useRef<HTMLDivElement>(null);
  const [animation, setAnimation] = useState<Animation | null>(null);
  const [isApplied, setIsApplied] = useState(false);
  const [hasThisEffect, setHasThisEffect] = useState(false);
  
  const isSelected = selectedTemplate?.id === template.id;
  const hasSelectedSubtitles = selectedSubtitleIds.length > 0;
  const hasRichTextSelection = richTextSelection && selectedSubtitleIds.includes(richTextSelection.subtitleId);
  
  const selectedSubtitle = hasSelectedSubtitles 
    ? subtitles.find(s => s.id === selectedSubtitleIds[0])
    : null;
  
  const getPreviewText = () => {
    if (hasRichTextSelection && selectedSubtitle) {
      if (selectedSubtitle.richText) {
        const fullText = convertRichTextToPlainText(selectedSubtitle.richText);
        return fullText.substring(richTextSelection.startIndex, richTextSelection.endIndex);
      } else {
        return selectedSubtitle.text.substring(richTextSelection.startIndex, richTextSelection.endIndex);
      }
    }
    return selectedSubtitle?.text || template.preview;
  };
  
  const previewText = getPreviewText();
  const previewStyle = selectedSubtitle?.style;

  useEffect(() => {
    if (selectedSubtitle?.richText && template.effects.length > 0) {
      const hasEffect = selectedSubtitle.richText.some(segment => 
        segment.animation?.name === template.effects[0].name
      );
      setHasThisEffect(hasEffect);
    } else {
      setHasThisEffect(false);
    }
  }, [selectedSubtitle, template.effects]);

  useEffect(() => {
    if (isSelected && previewRef.current) {
      playAnimation();
    } else {
      stopAnimation();
    }

    return () => stopAnimation();
  }, [isSelected, selectedSubtitle, richTextSelection]);

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
    
    if (!hasThisEffect) {
      if (hasRichTextSelection) {
        applyAnimationToRange(
          richTextSelection.subtitleId,
          primaryEffect,
          richTextSelection.startIndex,
          richTextSelection.endIndex
        );
      } else {
        selectedSubtitleIds.forEach(subtitleId => {
          applyAnimationToRange(subtitleId, primaryEffect);
        });
      }
      
      setIsApplied(true);
      setTimeout(() => setIsApplied(false), 1500);
    } else {
      handleRemoveEffect();
    }
  };

  const handleRemoveEffect = () => {
    if (!selectedSubtitle?.richText) return;
    
    const updatedSegments = selectedSubtitle.richText.map(segment => ({
      ...segment,
      style: segment.style,
      animation: segment.animation?.name === template.effects[0].name ? undefined : segment.animation
    }));
    
    updateSubtitleRichText(selectedSubtitle.id, updatedSegments);
    setHasThisEffect(false);
  };

  const getButtonText = () => {
    if (hasThisEffect) {
      return '移除动效';
    }
    if (isApplied) {
      return '✓ 已应用';
    }
    return hasRichTextSelection ? '应用到选中片段' : '应用到整个字幕';
  };

  const getButtonStyle = () => {
    if (hasThisEffect) {
      return 'bg-red-600 hover:bg-red-700 text-white';
    }
    if (isApplied) {
      return 'bg-green-600 text-white';
    }
    return 'bg-accent-purple hover:bg-accent-purple/80 text-white';
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

      {hasThisEffect && (
        <div className="absolute top-1 left-1 w-3 h-3 bg-orange-500 rounded-full" />
      )}

      {isApplied && (
        <div className="absolute top-1 left-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      )}
      
      {isSelected && hasSelectedSubtitles && (
        <div className="absolute bottom-1 left-1 right-1">
          <button
            onClick={handleApply}
            className={`w-full py-1 px-2 text-xs rounded transition-colors ${getButtonStyle()}`}
          >
            {getButtonText()}
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