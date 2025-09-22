import { useEffect, useRef, useState } from 'react';
import { useTemplateStore, useSelectedTemplate, useIsPreviewPlaying } from '@/stores/useTemplateStore';
import { convertToWebAnimation } from '@/utils/animationUtils';

export function AnimationPreview() {
  const selectedTemplate = useSelectedTemplate();
  const isPreviewPlaying = useIsPreviewPlaying();
  const { startPreview, stopPreview } = useTemplateStore();
  const previewRef = useRef<HTMLDivElement>(null);
  const [animation, setAnimation] = useState<Animation | null>(null);

  useEffect(() => {
    if (!selectedTemplate || !previewRef.current) return;

    if (isPreviewPlaying) {
      playAnimation();
    } else {
      stopAnimation();
    }

    return () => stopAnimation();
  }, [selectedTemplate, isPreviewPlaying]);

  const playAnimation = () => {
    if (!selectedTemplate || !previewRef.current) return;

    const element = previewRef.current;
    const effects = selectedTemplate.effects;

    if (effects.length === 0) return;

    const primaryEffect = effects[0];
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
          if (isPreviewPlaying) {
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

  const handleTogglePreview = () => {
    if (isPreviewPlaying) {
      stopPreview();
    } else {
      startPreview();
    }
  };

  if (!selectedTemplate) {
    return (
      <div className="h-20 bg-bg-tertiary rounded-lg flex items-center justify-center">
        <div className="text-text-tertiary text-sm">选择动效模板预览</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-20 bg-bg-tertiary rounded-lg flex items-center justify-center relative overflow-hidden">
        <div 
          ref={previewRef}
          className="text-lg font-medium text-text-primary"
        >
          {selectedTemplate.preview}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-text-secondary">
          {selectedTemplate.name}
        </div>
        <button
          onClick={handleTogglePreview}
          className="px-3 py-1 text-xs bg-accent-purple hover:bg-accent-purple/80 text-white rounded transition-colors"
        >
          {isPreviewPlaying ? '停止' : '预览'}
        </button>
      </div>
    </div>
  );
}