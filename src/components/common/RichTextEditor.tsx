import { useState, useEffect } from 'react';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useTextElementStore } from '@/stores/useTextElementStore';
import { useUIStore } from '@/stores/useUIStore';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';
import { TemplateQuickAccess } from './TemplateQuickAccess';
import { BasicEffectsSection } from './BasicEffectsSection';
import { AlignmentSection } from './AlignmentSection';
import { HighlightColorSection } from './HighlightColorSection';
import { StrokeSection } from './StrokeSection';
import { ShadowSection } from './ShadowSection';
import { BackgroundSection } from './BackgroundSection';

interface RichTextEditorProps {
  targetType: 'subtitle' | 'textElement';
  targetId: string;
  onClose: () => void;
}

export function RichTextEditor({ targetType, targetId, onClose }: RichTextEditorProps) {
  const { 
    subtitles, 
    updateSubtitle, 
    applyStyleToAllSubtitles
  } = useSubtitleStore();
  
  const { 
    textElements, 
    updateTextElement,
    updateTextElementText,
    applyStyleToAllTextElementsOfType,
    getTextElementType
  } = useTextElementStore();
  
  const currentObject = targetType === 'subtitle'
    ? subtitles.find(s => s.id === targetId)
    : textElements.find(e => e.id === targetId);
  
  const [localText, setLocalText] = useState(currentObject?.text || '');
  
  useEffect(() => {
    if (currentObject) {
      setLocalText(currentObject.text);
    }
  }, [currentObject?.text]);
  
  if (!currentObject) return null;
  
  const currentStyle = currentObject.style || DEFAULT_SUBTITLE_STYLE;
  
  const handleStyleChange = (updates: Partial<typeof currentStyle>) => {
    if (targetType === 'subtitle') {
      updateSubtitle(targetId, { 
        style: { ...currentStyle, ...updates } 
      });
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
    if (targetType === 'subtitle') {
      applyStyleToAllSubtitles(currentStyle);
    } else {
      const elementType = getTextElementType(targetId);
      applyStyleToAllTextElementsOfType(elementType, currentStyle);
    }
  };
  
  return (
    <div className="w-96 h-full bg-bg-secondary border-l border-border-primary overflow-y-auto flex flex-col">
      <div className="flex-shrink-0 p-4 border-b border-border-secondary flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">样式编辑</h2>
          <p className="text-xs text-text-secondary mt-1">
            {targetType === 'subtitle' ? '字幕' : '文字元素'}
          </p>
        </div>
        <button 
          onClick={onClose}
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
        />
        
        {targetType === 'subtitle' && (
          <AlignmentSection 
            alignment={currentStyle.alignment}
            onChange={(alignment) => handleStyleChange({ alignment })}
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
          className="w-full py-3 bg-bg-tertiary hover:bg-accent-purple text-text-primary hover:text-white border border-border-secondary rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>🎯</span>
          <span>运用于全长视频</span>
        </button>
      </div>
    </div>
  );
}