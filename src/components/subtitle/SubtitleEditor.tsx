import { useState, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUIStore } from '@/stores/useUIStore';
import { msToSRTTime } from '@/utils/subtitleParser';

export function SubtitleEditor() {
  const { subtitles, updateSubtitle, validateSubtitle } = useProjectStore();
  const { editingSubtitleId, setEditingSubtitle } = useUIStore();
  
  const [editText, setEditText] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const currentSubtitle = editingSubtitleId 
    ? subtitles.find(s => s.id === editingSubtitleId)
    : null;

  useEffect(() => {
    if (currentSubtitle) {
      setEditText(currentSubtitle.text);
      setEditStartTime(msToSRTTime(currentSubtitle.startTime));
      setEditEndTime(msToSRTTime(currentSubtitle.endTime));
      setErrors([]);
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

    const updates = {
      text: editText.trim(),
      startTime: startTimeMs,
      endTime: endTimeMs,
    };

    const validationErrors = validateSubtitle(updates);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    updateSubtitle(currentSubtitle.id, updates);
    setEditingSubtitle(null);
    setErrors([]);
  };

  const handleCancel = () => {
    setEditingSubtitle(null);
    setErrors([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!currentSubtitle) {
    return (
      <div className="p-4 bg-bg-secondary border-t border-border-secondary">
        <div className="text-center text-text-tertiary">
          <div className="text-sm">双击字幕开始编辑</div>
        </div>
      </div>
    );
  }

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
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 text-sm bg-bg-tertiary border border-border-secondary rounded text-text-primary resize-none"
            rows={3}
            placeholder="输入字幕内容..."
          />
          <div className="text-xs text-text-tertiary mt-1">
            {editText.length}/100 字符 • Ctrl+Enter 保存 • Esc 取消
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