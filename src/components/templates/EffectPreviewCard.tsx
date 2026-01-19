import { useEffect, useRef, useState, useMemo, Fragment } from 'react';
import {
  useTemplateStore,
  useSelectedTemplate,
  type AnyTemplate,
  isDynamicTemplate,
  isStaticTemplate,
  isAnimationTemplate,
  isRichTextStyleTemplate,
  isSceneTemplate 
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
import { SubtitleScene } from '@/components/video/SubtitleScene';

interface EffectPreviewCardProps {
  template: AnyTemplate;
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
  const [isHovered, setIsHovered] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);

  const isSelected = selectedTemplate?.id === template.id;
  const isScene = isSceneTemplate(template);
  const hasRichTextSelection = richTextSelection && selectedSubtitleIds.includes(richTextSelection.subtitleId);

  const getPreviewText = () => {
    if (isRichTextStyleTemplate(template)) return template.preview || 'Rich Text';
    if (hasRichTextSelection && selectedSubtitle) {
      const text = selectedSubtitle.richText 
        ? convertRichTextToPlainText(selectedSubtitle.richText) 
        : selectedSubtitle.text;
      return text.substring(richTextSelection.startIndex, richTextSelection.endIndex);
    }
    return selectedSubtitle?.text || template.name;
  };

  const previewText = getPreviewText();

  const templateStyle = useMemo(() => {
    if (isRichTextStyleTemplate(template)) return template.segments[0]?.style || DEFAULT_SUBTITLE_STYLE;
    if (isDynamicTemplate(template) || isStaticTemplate(template)) return convertTemplateToSubtitleStyle(template.style);
    return selectedSubtitle?.style || DEFAULT_SUBTITLE_STYLE;
  }, [template, selectedSubtitle]);

  const cssPreviewStyle = useMemo(() => {
    const fullStyle = { ...DEFAULT_SUBTITLE_STYLE, ...templateStyle };
    fullStyle.fontSize = Math.min(fullStyle.fontSize, 14);
    return convertStyleToCSS(fullStyle);
  }, [templateStyle]);

  const primaryEffect = useMemo((): AnimationEffect | null => {
    if (isRichTextStyleTemplate(template)) return template.segments[0]?.animation || null;
    if (isDynamicTemplate(template)) return template.animation;
    if (isAnimationTemplate(template) && template.effects.length > 0) return template.effects[0];
    return null;
  }, [template]);

 useEffect(() => {
    if (isScene) {
      // 动态场景：只看 ID
      setHasThisEffect(selectedSubtitle?.templateId === template.id);
    } else if (selectedSubtitle?.richText && primaryEffect) {
      // 动画效果：看动画名
      setHasThisEffect(selectedSubtitle.richText.some(seg => seg.animation?.name === primaryEffect.name));
    } else if (isStaticTemplate(template)) {
      // 基本模板：
      if (selectedSubtitle?.templateId === template.id) {
        // 1. ID 匹配成功 -> true
        setHasThisEffect(true);
      } else if (selectedSubtitle?.style) {
        // 2. ID 不匹配，尝试比对样式（作为兜底）
        const current = selectedSubtitle.style;
        const target = convertTemplateToSubtitleStyle(template.style);
        // 注意：这里依然是浅比较，复杂样式仍会失败，但有 ID 匹配在前，这里失败也没关系
        const isStyleMatch = Object.keys(target).every(k => current[k as keyof typeof current] === target[k as keyof typeof target]);
        setHasThisEffect(isStyleMatch);
      } else {
        // 3. 既无 ID 也无样式 -> false (补全这个逻辑更安全)
        setHasThisEffect(false);
      }
    } else {
      // 其他情况
      setHasThisEffect(false);
    }
  }, [selectedSubtitle, template, primaryEffect, isScene]);

  useEffect(() => {
    if (isScene) {
      if (!isHovered && !isSelected) {
        setPreviewTime(0);
        return;
      }
      let frameId: number;
      const start = performance.now();
      const update = () => {
        setPreviewTime(((performance.now() - start) % 3000) / 1000);
        frameId = requestAnimationFrame(update);
      };
      frameId = requestAnimationFrame(update);
      return () => cancelAnimationFrame(frameId);
    } else {
      if (isSelected && previewRef.current && primaryEffect) {
        playAnimation();
      } else {
        stopAnimation();
      }
    }
    return () => stopAnimation();
  }, [isSelected, isHovered, isScene, primaryEffect]);

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
    const anim = element.animate(keyframes, options);
    setAnimation(anim);
    if (primaryEffect.type !== 'continuous') {
      anim.onfinish = () => setTimeout(() => isSelected && playAnimation(), 500);
    }
  };

  const stopAnimation = () => {
    if (animation) {
      animation.cancel();
      setAnimation(null);
    }
  };

  const mockSubtitle = useMemo(() => {
    if (!isScene) return null;
    return {
      id: `prev-${template.id}`,
      text: template.name,
      startTime: 0,
      endTime: 3000,
      templateId: template.id,
      style: { ...DEFAULT_SUBTITLE_STYLE, fontSize: 48, fontWeight: 900, color: '#FFFFFF' }
    };
  }, [template, isScene]);

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fn = hasThisEffect ? removeTemplateFromSubtitle : applyTemplateToSubtitle;
    if (hasRichTextSelection && !isRichTextStyleTemplate(template)) {
      fn(richTextSelection.subtitleId, template, richTextSelection.startIndex, richTextSelection.endIndex);
    } else {
      selectedSubtitleIds.forEach(id => fn(id, template));
    }
    if (!hasThisEffect) {
      setIsApplied(true);
      setTimeout(() => setIsApplied(false), 1500);
    }
  };

  return (
    <Fragment>
      <div
        onClick={() => selectTemplate(template)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        className={`relative w-full h-24 rounded-lg border-2 transition-all duration-200 hover:scale-105 overflow-hidden group cursor-pointer ${
          isSelected ? 'border-accent-purple shadow-lg shadow-accent-purple/20' : 'border-border-secondary'
        }`}
      >
        <div className="absolute inset-0 bg-bg-secondary flex items-center justify-center p-2">
          {isScene ? (
            <div className="w-full h-full pointer-events-none scale-[0.3] origin-center flex items-center justify-center">
               <SubtitleScene subtitle={mockSubtitle} currentTime={previewTime} scaleFactor={1} isPreview={true} />
            </div>
          ) : (
            <div ref={previewRef} className="text-sm font-medium text-text-primary truncate" style={cssPreviewStyle}>
              {previewText}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white px-2 py-0.5 z-10 truncate">
          {template.name}
        </div>

        {isSelected && <div className="absolute top-1 right-1 w-3 h-3 bg-accent-purple rounded-full z-20" />}
        
        {template.category === 'custom' && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsDeleteConfirmOpen(true); }}
            className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 z-30"
          >
            <XMarkIcon className="w-3 h-3" />
          </button>
        )}

        {isSelected && hasSelectedSubtitles && (
          <div className="absolute bottom-1 left-1 right-1 z-20">
            <button
              onClick={handleApply}
              className={`w-full py-1 text-[10px] rounded ${
                hasThisEffect ? 'bg-red-600' : isApplied ? 'bg-green-600' : 'bg-accent-purple'
              } text-white`}
            >
              {hasThisEffect ? '移除' : isApplied ? '✓ 已应用' : '应用'}
            </button>
          </div>
        )}
      </div>

      {isDeleteConfirmOpen && (
        <Modal title="删除预设" isOpen={true} onClose={() => setIsDeleteConfirmOpen(false)}>
          <div className="p-4 space-y-4">
            <p className="text-sm">确定删除 "{template.name}" 吗？</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="px-4 py-2 bg-bg-tertiary rounded-lg text-sm">取消</button>
              <button onClick={() => { removeCustomTemplate(template.id); setIsDeleteConfirmOpen(false); }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">删除</button>
            </div>
          </div>
        </Modal>
      )}
    </Fragment>
  );
}