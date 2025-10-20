import { useState, useEffect, useRef } from 'react';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useUIStore } from '@/stores/useUIStore';
import { useMediaStore } from '@/stores/useMediaStore';
import { msToSRTTime } from '@/utils/subtitleParser';
import { 
  convertRichTextToPlainText, 
  createRichTextFromPlainText, 
  updateRichTextFromPlainText
} from '@/utils/textStyleUtils';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';
import type { RichTextSegment } from '@/types/subtitle';

enum UpdateType {
  TEXT_INPUT = 'text_input',
  STYLE_APPLY = 'style_apply',
  CLEAR_FORMAT = 'clear_format',
  INIT = 'init'
}

export function SubtitleEditor() {
  const { 
    subtitles, 
    updateSubtitleRichText, 
    validateSubtitle,
    hasSubtitleAnimations,
    clearAllAnimations,
    getSubtitleAnimations,
    removeSubtitleAudio
  } = useSubtitleStore();
  const { 
    editingSubtitleId, 
    setEditingSubtitle, 
    setActivePanel,
    setRichTextSelection,
    clearRichTextSelection
  } = useUIStore();
  const { placedMedia, removeMedia } = useMediaStore();
  
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [richTextSegments, setRichTextSegments] = useState<RichTextSegment[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);

  
  const editorRef = useRef<HTMLDivElement>(null);

  const currentSubtitle = editingSubtitleId 
    ? subtitles.find(s => s.id === editingSubtitleId)
    : null;

  const currentSubtitleMedia = currentSubtitle ? 
    placedMedia.filter(item =>
      item.position.startTime === currentSubtitle.startTime &&
      item.position.endTime === currentSubtitle.endTime
    ) : [];

  const updateRichTextWithType = (newSegments: RichTextSegment[], type: UpdateType) => {
    if (type === UpdateType.TEXT_INPUT) {
      return;
    }
    
    setRichTextSegments(newSegments);
  };

  useEffect(() => {
    if (currentSubtitle) {
      setEditStartTime(msToSRTTime(currentSubtitle.startTime));
      setEditEndTime(msToSRTTime(currentSubtitle.endTime));
      
      let initialSegments: RichTextSegment[];
      if (currentSubtitle.richText) {
        initialSegments = [...currentSubtitle.richText];
      } else {
        initialSegments = createRichTextFromPlainText(currentSubtitle.text, currentSubtitle.style);
      }
      
      updateRichTextWithType(initialSegments, UpdateType.INIT);
      setErrors([]);
      setSelectionRange(null);
      clearRichTextSelection();
    }
  }, [currentSubtitle, clearRichTextSelection]);

  const parseTimeToMs = (timeStr: string): number => {
    const match = timeStr.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!match) return 0;
    
    const [, hours, minutes, seconds, milliseconds] = match;
    return (
      parseInt(hours) * 3600000 +
      parseInt(minutes) * 60000 +
      parseInt(seconds) * 1000 +
      parseInt(milliseconds)
    );
  };

  const handleSave = () => {
    if (!currentSubtitle) return;

    const startTimeMs = parseTimeToMs(editStartTime);
    const endTimeMs = parseTimeToMs(editEndTime);
    
    const currentPlainText = editorRef.current?.innerText || '';
    const updatedSegments = updateRichTextFromPlainText(richTextSegments, currentPlainText);

    const updates = {
      text: currentPlainText.trim(),
      startTime: startTimeMs,
      endTime: endTimeMs,
      richText: updatedSegments
    };

    const validationErrors = validateSubtitle(updates);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    updateSubtitleRichText(currentSubtitle.id, updatedSegments);
    setEditingSubtitle(null);
    setErrors([]);
  };

  const handleCancel = () => {
    setEditingSubtitle(null);
    setErrors([]);
  };

  const handleRemoveAllAnimations = () => {
    if (!currentSubtitle) return;
    clearAllAnimations(currentSubtitle.id);
    if (currentSubtitle.richText) {
      const updatedSegments = currentSubtitle.richText.map(segment => ({
        ...segment,
        animation: undefined
      }));
      updateRichTextWithType(updatedSegments, UpdateType.CLEAR_FORMAT);
    }
  };

  const handleClearStyles = () => {
    if (!currentSubtitle) return;
    const updatedSegments = richTextSegments.map(segment => ({
      ...segment,
      style: { ...DEFAULT_SUBTITLE_STYLE },
      animation: segment.animation
    }));
    updateRichTextWithType(updatedSegments, UpdateType.CLEAR_FORMAT);
  };

  const handleSwitchToStylePanel = () => {
    setActivePanel('text');
  };

  const handleSwitchToTemplatePanel = () => {
    setActivePanel('templates');
  };

  const handleSwitchToMediaPanel = () => {
    setActivePanel('media');
  };

  const handleRemoveAudio = () => {
    if (!currentSubtitle) return;
    removeSubtitleAudio(currentSubtitle.id);
  };

  const updateEditorContent = () => {
    if (!editorRef.current) return;
    
    const html = richTextSegments.map(segment => {
      const style = {
        color: segment.style?.color || '#ffffff',
        fontFamily: segment.style?.fontFamily || 'inherit',
        fontSize: segment.style?.fontSize ? `${segment.style.fontSize}px` : 'inherit',
        fontWeight: segment.style?.fontWeight || 'inherit',
        fontStyle: segment.style?.fontStyle || 'inherit',
        textShadow: segment.style?.shadow?.enabled 
          ? `0px 0px ${segment.style.shadow.blur}px ${segment.style.shadow.color}`
          : 'none'
      };
      
      const styleStr = Object.entries(style)
        .map(([key, value]) => `${key.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${value}`)
        .join('; ');
      
      const animationClass = segment.animation ? 'has-animation' : '';
      
      return `<span class="${animationClass}" style="${styleStr}" data-animation="${segment.animation?.name || ''}">${segment.text.replace(/\n/g, '<br>')}</span>`;
    }).join('');
    
    editorRef.current.innerHTML = html;
  };

  const handleInput = () => {
  };

  const getSelectionRange = (): {start: number, end: number} | null => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(editorRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    
    const start = preSelectionRange.toString().length;
    const end = start + range.toString().length;
    
    return { start, end };
  };

  const handleSelectionChange = () => {
    const range = getSelectionRange();
    setSelectionRange(range);
    
    if (range && range.start !== range.end && currentSubtitle) {
      setRichTextSelection({
        subtitleId: currentSubtitle.id,
        startIndex: range.start,
        endIndex: range.end
      });
    } else {
      clearRichTextSelection();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  useEffect(() => {
    updateEditorContent();
  }, [richTextSegments]);

  if (!currentSubtitle) {
    return (
      <div className="p-4 bg-bg-primary border-t border-border-secondary">
        <div className="text-center text-text-tertiary">
          <div className="text-sm">双击字幕开始编辑</div>
        </div>
      </div>
    );
  }

  const selectedText = selectionRange && selectionRange.start !== selectionRange.end;
  const hasAnimations = hasSubtitleAnimations(currentSubtitle.id);
  const subtitleAnimations = getSubtitleAnimations(currentSubtitle.id);
  
  const hasCustomStyles = richTextSegments.some(segment => {
    const style = segment.style || DEFAULT_SUBTITLE_STYLE;
    return style.fontSize !== DEFAULT_SUBTITLE_STYLE.fontSize ||
           style.fontFamily !== DEFAULT_SUBTITLE_STYLE.fontFamily ||
           style.color !== DEFAULT_SUBTITLE_STYLE.color;
  });

  return (
    <div className="p-4 bg-bg-primary border-t border-border-secondary space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-text-primary font-medium">编辑字幕</h4>
        <button
          onClick={handleCancel}
          className="text-text-tertiary hover:text-text-primary"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-text-tertiary mb-1">开始时间</label>
            <input
              type="text"
              value={editStartTime}
              onChange={(e) => setEditStartTime(e.target.value)}
              className="w-full px-2 py-1 text-sm bg-bg-tertiary border border-border-secondary rounded text-text-primary font-mono"
              placeholder="00:00:00,000"
            />
          </div>
          <div>
            <label className="block text-xs text-text-tertiary mb-1">结束时间</label>
            <input
              type="text"
              value={editEndTime}
              onChange={(e) => setEditEndTime(e.target.value)}
              className="w-full px-2 py-1 text-sm bg-bg-tertiary border border-border-secondary rounded text-text-primary font-mono"
              placeholder="00:00:00,000"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-text-tertiary mb-1">字幕内容</label>
          
          {selectedText && (
            <div className="mb-2 p-2 bg-bg-tertiary rounded border border-border-secondary">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">已选中文本</span>
                <button
                  onClick={handleSwitchToStylePanel}
                  className="p-1.5 bg-accent-purple text-white rounded hover:bg-accent-purple/80 transition-colors"
                  title="文字样式"
                >
                  🎨
                </button>
                <button
                  onClick={handleSwitchToTemplatePanel}
                  className="p-1.5 bg-accent-purple text-white rounded hover:bg-accent-purple/80 transition-colors"
                  title="动态效果"
                >
                  ✨
                </button>
                <button
                  onClick={handleSwitchToMediaPanel}
                  className="p-1.5 bg-accent-purple text-white rounded hover:bg-accent-purple/80 transition-colors"
                  title="插入媒体"
                >
                  🖼️
                </button>
              </div>
            </div>
          )}
          
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onMouseUp={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            onKeyDown={handleKeyDown}
            className="w-full min-h-20 px-3 py-2 text-sm bg-bg-tertiary border border-border-secondary rounded text-text-primary resize-none overflow-y-auto focus:outline-none focus:ring-1 focus:ring-accent-purple"
            style={{ 
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
            suppressContentEditableWarning={true}
          />
          
          <div className="text-xs text-text-tertiary mt-1">
            {convertRichTextToPlainText(richTextSegments).length}/100 字符 • 选中文本后可在左侧面板设置样式和动效 • Ctrl+Enter 保存 • Esc 取消
          </div>
        </div>

        {(hasAnimations || hasCustomStyles || currentSubtitle.audioTrack || currentSubtitleMedia.length > 0) && (
          <div>
            <label className="block text-xs text-text-tertiary mb-1">配音与格式管理</label>
            <div className="bg-bg-tertiary border border-border-secondary rounded p-3 space-y-2">
              {currentSubtitle.audioTrack && (
                <div className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/20 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🎵</span>
                    <span className="text-xs text-text-primary">
                      配音: {currentSubtitle.audioTrack.track.name}
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveAudio}
                    className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    移除配音
                  </button>
                </div>
              )}

              {currentSubtitleMedia.map(mediaItem => (
                <div key={mediaItem.media.id} className="flex items-center justify-between p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🖼️</span>
                    <span className="text-xs text-text-primary">
                      媒体: {mediaItem.media.type === 'sticker' ? '贴纸' : 'GIF'}
                    </span>
                  </div>
                  <button
                    onClick={() => removeMedia(mediaItem.media.id)}
                    className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    移除媒体
                  </button>
                </div>
              ))}
              
              {(hasCustomStyles || hasAnimations) && (
                <div className="flex gap-2">
                  {hasCustomStyles && (
                    <button
                      onClick={handleClearStyles}
                      className="px-3 py-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
                    >
                      清除样式
                    </button>
                  )}
                  {hasAnimations && (
                    <button
                      onClick={handleRemoveAllAnimations}
                      className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      清除动效
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="text-xs text-accent-red space-y-1">
            {errors.map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 py-2 px-4 text-sm bg-accent-purple hover:bg-accent-purple/80 text-white rounded transition-colors"
          >
            保存
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm bg-bg-tertiary hover:bg-bg-elevated text-text-secondary rounded transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}