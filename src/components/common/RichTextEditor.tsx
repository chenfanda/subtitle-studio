import { useState, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
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
    textElements, 
    updateSubtitle, 
    updateTextElement,
    updateTextElementText,
    applyStyleToAllSubtitles,
    applyStyleToAllTextElementsOfType,
    getTextElementType
  } = useProjectStore();
  
  // ✅ 获取当前对象
  const currentObject = targetType === 'subtitle'
    ? subtitles.find(s => s.id === targetId)
    : textElements.find(e => e.id === targetId);
  
  const [localText, setLocalText] = useState(currentObject?.text || '');
  
  // ✅ 同步文字内容
  useEffect(() => {
    if (currentObject) {
      setLocalText(currentObject.text);
    }
  }, [currentObject?.text]);
  
  if (!currentObject) return null;
  
  const currentStyle = currentObject.style || DEFAULT_SUBTITLE_STYLE;
  
  // ✅ 样式更新
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
  
  // ✅ 文字更新（仅文字元素）
  const handleTextChange = (text: string) => {
    setLocalText(text);
  };
  
  const handleTextBlur = () => {
    if (targetType === 'textElement' && localText !== currentObject.text) {
      updateTextElementText(targetId, localText);
    }
  };
  
  // ✅ 运用于全长视频
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
      {/* 标题栏 */}
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
      
      {/* 滚动内容区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 🆕 文字输入框（仅文字元素显示） */}
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
        
        {/* 模板区域 */}
            {targetType === 'subtitle' && (
            <TemplateQuickAccess 
                targetType={targetType}
                targetId={targetId}
            />
            )}
        
        {/* 基本效果 */}
        <BasicEffectsSection 
          targetType={targetType}
          style={currentStyle}
          onChange={handleStyleChange}
        />
        
        {/* 对齐（仅字幕显示） */}
        {targetType === 'subtitle' && (
          <AlignmentSection 
            alignment={currentStyle.alignment}
            onChange={(alignment) => handleStyleChange({ alignment })}
          />
        )}
        
        {/* 高亮色（仅字幕显示） */}
        {targetType === 'subtitle' && (
          <HighlightColorSection 
            color={currentStyle.highlightColor}
            onChange={(highlightColor) => handleStyleChange({ highlightColor })}
          />
        )}
        
        {/* 描边（通用） */}
        <StrokeSection 
          stroke={currentStyle.stroke}
          onChange={(stroke) => handleStyleChange({ stroke })}
        />
        
        {/* 阴影（仅字幕显示） */}
        {targetType === 'subtitle' && (
          <ShadowSection 
            shadow={currentStyle.shadow}
            onChange={(shadow) => handleStyleChange({ shadow })}
          />
        )}
        
        {/* 背景（通用） */}
        <BackgroundSection 
          backgroundColor={currentStyle.backgroundColor}
          onChange={(backgroundColor) => handleStyleChange({ backgroundColor })}
        />
        
        {/* 运用于全长视频 */}
        <button
          onClick={handleApplyToAll}
          className="w-full py-3 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>✅</span>
          <span>运用于全长视频</span>
        </button>
      </div>
    </div>
  );
}