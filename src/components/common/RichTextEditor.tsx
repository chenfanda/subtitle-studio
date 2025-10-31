import { useState, useEffect, useMemo } from 'react';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useTextElementStore } from '@/stores/useTextElementStore';
import { useUIStore } from '@/stores/useUIStore';
import { useTemplateStore } from '@/stores/useTemplateStore';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';
import { TemplateQuickAccess } from './TemplateQuickAccess';
import { BasicEffectsSection } from './BasicEffectsSection';
import { AlignmentSection } from './AlignmentSection';
import { HighlightColorSection } from './HighlightColorSection';
import { StrokeSection } from './StrokeSection';
import { ShadowSection } from './ShadowSection';
import { BackgroundSection } from './BackgroundSection';
import {
  createRichTextFromPlainText,
  applyStyleToSegments,
} from '@/utils/textStyleUtils';
import { SaveTemplateModal } from '@/components/templates/SaveTemplateModal';
// 导入 Lucide 图标
import { Target, Hourglass, Check } from 'lucide-react';

interface RichTextEditorProps {
  targetType: 'subtitle' | 'textElement';
  targetId: string;
  onClose: () => void;
}

export function RichTextEditor({ targetType, targetId, onClose }: RichTextEditorProps) {
  const {
    subtitles,
    applyStyleToAllSubtitles,
    updateSubtitleRichText
  } = useSubtitleStore();

  const {
    textElements,
    updateTextElement,
    updateTextElementText,
    applyStyleToAllTextElementsOfType,
    getTextElementType
  } = useTextElementStore();

  const saveCustomTemplate = useTemplateStore((state) => state.saveCustomTemplate);
  const customTemplateCount = useTemplateStore((state) => state.customRichTextTemplates.length);

  const [applyState, setApplyState] = useState<'idle' | 'loading' | 'applied'>('idle');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const clearRichTextSelection = useUIStore((state) => state.clearRichTextSelection);
  const selection = useUIStore((state) => state.richTextSelection);

  const currentObject = useMemo(() => targetType === 'subtitle'
    ? subtitles.find(s => s.id === targetId)
    : textElements.find(e => e.id === targetId)
  , [subtitles, textElements, targetId, targetType]);

  const [localText, setLocalText] = useState(currentObject?.text || '');

  useEffect(() => {
    if (currentObject) {
      setLocalText(currentObject.text);
    }
  }, [currentObject?.text]);

  const handleClose = () => {
    clearRichTextSelection();
    onClose();
  };

  if (!currentObject) return null;

  const currentStyle = useMemo(() => {
    if (!currentObject) return DEFAULT_SUBTITLE_STYLE;

    let styleToDisplay = currentObject.style || DEFAULT_SUBTITLE_STYLE;

    if (targetType === 'subtitle' && currentObject.richText && selection?.subtitleId === targetId) {
      let charIndex = 0;
      let foundStyle = null;
      for (const segment of currentObject.richText) {
        const segmentEnd = charIndex + segment.text.length;
        if (selection.startIndex >= charIndex && selection.startIndex < segmentEnd) {
          foundStyle = segment.style;
          break;
        }
        charIndex = segmentEnd;
      }

      if (foundStyle) {
        styleToDisplay = foundStyle || DEFAULT_SUBTITLE_STYLE;
      } else if (currentObject.richText.length > 0) {
        styleToDisplay = currentObject.richText[0].style || DEFAULT_SUBTITLE_STYLE;
      }
    } else if (targetType === 'subtitle' && currentObject.richText && currentObject.richText.length > 0) {
      styleToDisplay = currentObject.richText[0].style || DEFAULT_SUBTITLE_STYLE;
    }

    return { ...DEFAULT_SUBTITLE_STYLE, ...styleToDisplay };
  }, [currentObject, targetType, selection]);

  const handleStyleChange = (updates: Partial<typeof currentStyle>) => {
    setApplyState('idle');
    const currentSelection = useUIStore.getState().richTextSelection;

    const selectionToApply = (currentSelection && currentSelection.subtitleId === targetId)
      ? currentSelection
      : {
        subtitleId: targetId,
        startIndex: 0,
        endIndex: currentObject.text.length
      };

    if (targetType === 'subtitle') {
      const baseRichText = currentObject.richText || createRichTextFromPlainText(currentObject.text, currentStyle);

      const newSegments = applyStyleToSegments(
        baseRichText,
        selectionToApply.startIndex,
        selectionToApply.endIndex,
        updates
      );
      updateSubtitleRichText(targetId, newSegments);
    } else {
      updateTextElement(targetId, {
        style: { ...currentStyle, ...updates }
      });
    }
  };

  const handleTextChange = (text: string) => {
    setLocalText(text);
  };

  const handleTextBlur = () => {
    if (targetType === 'textElement' && localText !== currentObject.text) {
      updateTextElementText(targetId, localText);
    }
  };

  const handleApplyToAll = () => {
    setApplyState('loading');

    if (targetType === 'subtitle') {
      applyStyleToAllSubtitles(currentStyle);
    } else {
      const elementType = getTextElementType(targetId);
      applyStyleToAllTextElementsOfType(elementType, currentStyle);
    }

    setApplyState('applied');
  };

  const handleSaveStyle = () => {
    if (targetType === 'subtitle' && currentObject && currentObject.richText) {
      setIsSaveModalOpen(true);
    } else {
      console.warn('Cannot save rich text template: richText data not found.');
    }
  };

  const handleConfirmSave = (templateName: string) => {
    if (currentObject?.richText) {
      saveCustomTemplate(currentObject.richText, templateName);
    }
    setIsSaveModalOpen(false);
  };

  return (
    <div className="w-75 h-full bg-bg-primary border-l border-border-primary overflow-y-auto flex flex-col">
      <div className="flex-shrink-0 p-4 border-b border-border-secondary flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">样式编辑</h2>
        </div>
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {targetType === 'textElement' && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary">文字内容</label>
            <textarea
              value={localText}
              onChange={(e) => handleTextChange(e.target.value)}
              onBlur={handleTextBlur}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-lg text-sm text-text-primary resize-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
              rows={3}
              placeholder="输入文字内容..."
            />
          </div>
        )}

        {targetType === 'subtitle' && (
          <TemplateQuickAccess
            targetType={targetType}
            targetId={targetId}
          />
        )}

        <BasicEffectsSection
          targetType={targetType}
          style={currentStyle}
          onChange={handleStyleChange}
          onSaveStyle={handleSaveStyle}
        />

        {targetType === 'subtitle' && (
          <AlignmentSection
            alignment={currentStyle.alignment}
            verticalAlignment={currentStyle.verticalAlignment || 'center'}
            onChange={(alignment, verticalAlignment) => handleStyleChange({ alignment, verticalAlignment })}
          />
        )}

        {targetType === 'subtitle' && (
          <HighlightColorSection
            color={currentStyle.highlightColor}
            intensity={currentStyle.highlightIntensity}
            onChange={(updates) => handleStyleChange({
              highlightColor: updates.color,
              highlightIntensity: updates.intensity
            })}
          />
        )}

        <StrokeSection
          stroke={currentStyle.stroke}
          onChange={(stroke) => handleStyleChange({ stroke })}
        />

        {targetType === 'subtitle' && (
          <ShadowSection
            shadow={currentStyle.shadow}
            onChange={(shadow) => handleStyleChange({ shadow })}
          />
        )}

        <BackgroundSection
          backgroundColor={currentStyle.backgroundColor}
          backgroundShape={currentStyle.backgroundShape}
          onChange={(updates) => handleStyleChange(updates)}
        />

        <button
          onClick={handleApplyToAll}
          disabled={applyState !== 'idle'}
          className={`
            w-full py-3 border border-border-secondary rounded-lg font-medium transition-colors flex items-center justify-center gap-2
            ${applyState === 'idle' && 'bg-bg-tertiary hover:bg-accent-purple text-text-primary hover:text-white'}
            ${applyState === 'loading' && 'bg-gray-600 text-text-secondary cursor-not-allowed'}
            ${applyState === 'applied' && 'bg-green-700 text-white cursor-not-allowed'}
          `}
        >
          {applyState === 'idle' && (
            <>
              <Target className="w-4 h-4" />
              <span>运用于全长视频</span>
            </>
          )}
          {applyState === 'loading' && (
            <>
              <Hourglass className="w-4 h-4" />
              <span>运用中...</span>
            </>
          )}
          {applyState === 'applied' && (
            <>
              <Check className="w-4 h-4" />
              <span>已运用</span>
            </>
          )}
        </button>
      </div>

      {isSaveModalOpen && (
        <SaveTemplateModal
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleConfirmSave}
          initialName={`自定义富文本 ${customTemplateCount + 1}`}
        />
      )}
    </div>
  );
}