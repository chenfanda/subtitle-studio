import { useEffect, useRef, useState, useMemo, Fragment } from 'react';
import {
  useTemplateStore,
  useSelectedTemplate,
  type AnyTemplate, // Import AnyTemplate
  isDynamicTemplate, // Import type guards
  isStaticTemplate,
  isAnimationTemplate,
  isRichTextStyleTemplate
} from '@/stores/useTemplateStore';
import { useSelectedSubtitles, useRichTextSelection } from '@/stores/useUIStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { convertToWebAnimation } from '@/utils/animationUtils';
import {
  convertRichTextToPlainText,
  convertStyleToCSS,
  convertTemplateToSubtitleStyle
} from '@/utils/textStyleUtils';
import {
  type AnimationEffect
} from '@/types/animation';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';
import { Modal } from '@/components/common/Modal';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface EffectPreviewCardProps {
  template: AnyTemplate; // Use imported AnyTemplate
  targetSubtitleId?: string;
}

export function EffectPreviewCard({ template, targetSubtitleId }: EffectPreviewCardProps) {
  const selectedTemplate = useSelectedTemplate();
  const selectTemplate = useTemplateStore((state) => state.selectTemplate);
  const removeCustomTemplate = useTemplateStore((state) => state.removeCustomTemplate);

  const applyTemplateToSubtitle = useTemplateStore((state) => state.applyTemplateToSubtitle);
  const removeTemplateFromSubtitle = useTemplateStore((state) => state.removeTemplateFromSubtitle);

  const globalSelectedSubtitleIds = useSelectedSubtitles();
  const globalRichTextSelection = useRichTextSelection();

  const selectedSubtitleIds = targetSubtitleId ? [targetSubtitleId] : globalSelectedSubtitleIds;

  const hasSelectedSubtitles = selectedSubtitleIds.length > 0;

  const selectedSubtitle = useSubtitleStore((state) =>
    hasSelectedSubtitles
      ? state.subtitles.find(s => s.id === selectedSubtitleIds[0]) || null
      : null
  );

  const richTextSelection = targetSubtitleId ? null : globalRichTextSelection;

  const previewRef = useRef<HTMLDivElement>(null);
  const [animation, setAnimation] = useState<Animation | null>(null);
  const [isApplied, setIsApplied] = useState(false);
  const [hasThisEffect, setHasThisEffect] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const isSelected = selectedTemplate?.id === template.id;
  const hasRichTextSelection = richTextSelection && selectedSubtitleIds.includes(richTextSelection.subtitleId);

  const getPreviewText = () => {
    if (isRichTextStyleTemplate(template)) {
      return template.preview || template.segments[0]?.text || 'Rich Text';
    }
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

  const templateStyle = useMemo(() => {
    if (isRichTextStyleTemplate(template)) {
        // For rich text, maybe preview the style of the first segment?
        return template.segments[0]?.style || DEFAULT_SUBTITLE_STYLE;
    }
    if (isDynamicTemplate(template) || isStaticTemplate(template)) {
      return convertTemplateToSubtitleStyle(template.style);
    }
    // For pure animation templates, use the selected subtitle's style for preview
    return selectedSubtitle?.style || DEFAULT_SUBTITLE_STYLE;
  }, [template, selectedSubtitle]);

  const cssPreviewStyle = useMemo(() => {
    const fullStyle = { ...DEFAULT_SUBTITLE_STYLE, ...templateStyle };
    fullStyle.fontSize = Math.min(fullStyle.fontSize, 14);
    return convertStyleToCSS(fullStyle);
  }, [templateStyle]);

  const primaryEffect = useMemo((): AnimationEffect | null => {
    if (isRichTextStyleTemplate(template)) {
        // For rich text, maybe preview the animation of the first segment?
        return template.segments[0]?.animation || null;
    }
    if (isDynamicTemplate(template)) {
      return template.animation;
    }
    if (isAnimationTemplate(template) && template.effects.length > 0) {
      return template.effects[0];
    }
    return null;
  }, [template]);

  useEffect(() => {
    // Determine hasThisEffect based on template type
    if (selectedSubtitle?.richText && primaryEffect) {
        const effectName = primaryEffect.name;
        const hasAnimationEffect = selectedSubtitle.richText.some(
            (segment) => segment.animation?.name === effectName
        );
        // How to check if a rich text style template is applied? Complex comparison needed.
        // For now, base hasThisEffect primarily on animation for simplicity in rich text cases.
        setHasThisEffect(hasAnimationEffect);
    } else if (isStaticTemplate(template) && selectedSubtitle?.style) {
        // Rough check for static style (needs deep comparison utility)
        const currentStyle = selectedSubtitle.style || DEFAULT_SUBTITLE_STYLE;
        const templateStyleConverted = convertTemplateToSubtitleStyle(template.style);
        // This is a shallow comparison, a deep equal function would be better
        const stylesMatch = Object.keys(templateStyleConverted).every(
            key => currentStyle[key as keyof typeof currentStyle] === templateStyleConverted[key as keyof typeof templateStyleConverted]
        );
        setHasThisEffect(stylesMatch);
    }
     else {
      setHasThisEffect(false);
    }
  }, [selectedSubtitle, template, primaryEffect, richTextSelection, isSelected]);


  useEffect(() => {
    if (isSelected && previewRef.current && primaryEffect) {
      playAnimation();
    } else {
      stopAnimation();
    }

    return () => stopAnimation();
  }, [isSelected, selectedSubtitle, richTextSelection, primaryEffect]);

  const playAnimation = () => {
    if (!primaryEffect || !previewRef.current) return;

    const element = previewRef.current;
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

    const applyFn = hasThisEffect ? removeTemplateFromSubtitle : applyTemplateToSubtitle;

    if (hasRichTextSelection && !isRichTextStyleTemplate(template)) { // Rich text templates ignore selection
      applyFn(
        richTextSelection.subtitleId,
        template,
        richTextSelection.startIndex,
        richTextSelection.endIndex
      );
    } else {
      selectedSubtitleIds.forEach(subtitleId => {
        applyFn(subtitleId, template); // Rich text applies to whole subtitle implicitly here
      });
    }

    if (!hasThisEffect) {
      setIsApplied(true);
      setTimeout(() => setIsApplied(false), 1500);
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    removeCustomTemplate(template.id);
    setIsDeleteConfirmOpen(false);
  };

  const getButtonText = () => {
    if (hasThisEffect) {
      return '移除效果';
    }
    if (isApplied) {
      return '✓ 已应用';
    }
     // Rich text templates ignore selection for application
    return hasRichTextSelection && !isRichTextStyleTemplate(template) ? '应用到选中片段' : '应用到整个字幕';
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

  const isCustomTemplate = template.category === 'custom';

  return (
    <Fragment>
      <button
        onClick={handleCardClick}
        className={`
          relative w-full h-24 rounded-lg border-2 transition-all duration-200
          hover:scale-105 overflow-hidden group
          ${isSelected
            ? 'border-accent-purple shadow-lg shadow-accent-purple/20'
            : 'border-border-secondary hover:border-border-primary'
          }\n      `}
      >
        <div className="absolute inset-0 bg-bg-secondary flex items-center justify-center p-2">
          <div
            ref={previewRef}
            className="text-sm font-medium text-text-primary truncate"
            style={cssPreviewStyle}
          >
            {previewText}
          </div>
        </div>

        {isSelected && (
          <div className="absolute top-1 right-1 w-3 h-3 bg-accent-purple rounded-full" />
        )}

        {isCustomTemplate && (
          <button
            onClick={handleRemoveClick}
            className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all z-10"
            title="删除模板"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        )}

        {hasThisEffect && !isCustomTemplate && (
          <div className="absolute top-1 left-1 w-3 h-3 bg-orange-500 rounded-full" />
        )}

        {isApplied && !isCustomTemplate && (
          <div className="absolute top-1 left-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        )}

        {isSelected && hasSelectedSubtitles && (
          <div className="absolute bottom-1 left-1 right-1">
            <button
              onClick={handleApply}
              className={`w-full py-1 px-2 text-xs rounded transition-colors ${getButtonStyle()}`}          >
              {getButtonText()}
            </button>
          </div>
        )}

        {isSelected && !hasSelectedSubtitles && !targetSubtitleId && (
          <div className="absolute bottom-1 left-1 right-1">
            <div className="w-full py-1 px-2 text-xs bg-gray-600 text-gray-300 rounded text-center">
              请先选择字幕
            </div>
          </div>
        )}
      </button>

      {isDeleteConfirmOpen && (
        <Modal
          title="删除预设"
          isOpen={true}
          onClose={() => setIsDeleteConfirmOpen(false)}
        >
          <div className="p-4 space-y-4">
            <p className="text-sm text-text-primary">
              您确定要删除模板 "{template.name}" 吗？此操作无法撤销。
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-bg-tertiary text-text-primary hover:bg-border-secondary transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Fragment>
  );
}