import { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUIStore } from '@/stores/useUIStore';
import { msToSRTTime } from '@/utils/subtitleParser';
import { 
  convertRichTextToPlainText, 
  createRichTextFromPlainText, 
  applyStyleToSegments,
  mergeAdjacentSegments
} from '@/utils/textStyleUtils';
import type { RichTextSegment, SubtitleStyle } from '@/types/subtitle';

const QUICK_COLORS = [
  '#ffffff', '#ffff00', '#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff', '#ffa500'
];

const QUICK_FONTS = [
  'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', 'Arial'
];

export function SubtitleEditor() {
  const { subtitles, updateSubtitleRichText, validateSubtitle } = useProjectStore();
  const { editingSubtitleId, setEditingSubtitle } = useUIStore();
  
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [richTextSegments, setRichTextSegments] = useState<RichTextSegment[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);

  const currentSubtitle = editingSubtitleId 
    ? subtitles.find(s => s.id === editingSubtitleId)
    : null;

  useEffect(() => {
    if (currentSubtitle) {
      setEditStartTime(msToSRTTime(currentSubtitle.startTime));
      setEditEndTime(msToSRTTime(currentSubtitle.endTime));
      
      // 初始化富文本数据
      if (currentSubtitle.richText) {
        setRichTextSegments([...currentSubtitle.richText]);
      } else {
        setRichTextSegments(createRichTextFromPlainText(currentSubtitle.text, currentSubtitle.style));
      }
      
      setErrors([]);
      setSelectionRange(null);
    }
  }, [currentSubtitle]);

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
    const plainText = convertRichTextToPlainText(richTextSegments);

    const updates = {
      text: plainText.trim(),
      startTime: startTimeMs,
      endTime: endTimeMs,
      richText: richTextSegments
    };

    const validationErrors = validateSubtitle(updates);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    updateSubtitleRichText(currentSubtitle.id, richTextSegments);
    setEditingSubtitle(null);
    setErrors([]);
  };

  const handleCancel = () => {
    setEditingSubtitle(null);
    setErrors([]);
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
      
      return `<span style="${styleStr}">${segment.text.replace(/\n/g, '<br>')}</span>`;
    }).join('');
    
    editorRef.current.innerHTML = html;
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    
    const text = editorRef.current.innerText;
    setRichTextSegments(createRichTextFromPlainText(text, currentSubtitle?.style));
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
  };

  const applyStyleToSelection = (style: Partial<SubtitleStyle>) => {
    if (!selectionRange || selectionRange.start === selectionRange.end) return;
    
    const newSegments = applyStyleToSegments(
      richTextSegments, 
      selectionRange.start, 
      selectionRange.end, 
      style
    );
    
    const optimizedSegments = mergeAdjacentSegments(newSegments);
    setRichTextSegments(optimizedSegments);
    
    // 延迟更新编辑器内容
    setTimeout(() => {
      updateEditorContent();
    }, 0);
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
      <div className="p-4 bg-bg-secondary border-t border-border-secondary">
        <div className="text-center text-text-tertiary">
          <div className="text-sm">双击字幕开始编辑</div>
        </div>
      </div>
    );
  }

  const selectedText = selectionRange && selectionRange.start !== selectionRange.end;

  return (
    <div className="p-4 bg-bg-secondary border-t border-border-secondary space-y-4">
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
          
          {/* 格式化工具栏 */}
          {selectedText && (
            <div className="mb-2 p-2 bg-bg-tertiary rounded border border-border-secondary">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-text-tertiary">颜色:</span>
                {QUICK_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => applyStyleToSelection({ color })}
                    className="w-5 h-5 rounded border border-gray-500 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={`应用颜色 ${color}`}
                  />
                ))}
                
                <div className="w-px h-4 bg-border-secondary mx-1" />
                
                <select
                  onChange={(e) => applyStyleToSelection({ fontFamily: e.target.value })}
                  className="text-xs bg-bg-secondary border border-border-secondary rounded px-1 py-0.5"
                  defaultValue=""
                >
                  <option value="">字体</option>
                  {QUICK_FONTS.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
                
                <button
                  onClick={() => applyStyleToSelection({ fontWeight: 'bold' })}
                  className="px-2 py-0.5 text-xs bg-bg-secondary border border-border-secondary rounded hover:bg-bg-elevated"
                >
                  粗体
                </button>
                
                <button
                  onClick={() => applyStyleToSelection({ fontStyle: 'italic' })}
                  className="px-2 py-0.5 text-xs bg-bg-secondary border border-border-secondary rounded hover:bg-bg-elevated"
                >
                  斜体
                </button>
                
                <button
                  onClick={() => applyStyleToSelection({ 
                    shadow: { enabled: true, color: '#ffff00', offsetX: 0, offsetY: 0, blur: 8 }
                  })}
                  className="px-2 py-0.5 text-xs bg-bg-secondary border border-border-secondary rounded hover:bg-bg-elevated"
                >
                  发光
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
            {convertRichTextToPlainText(richTextSegments).length}/100 字符 • 选中文本显示格式化选项 • Ctrl+Enter 保存 • Esc 取消
          </div>
        </div>

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