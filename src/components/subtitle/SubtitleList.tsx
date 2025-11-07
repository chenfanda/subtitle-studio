import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Pencil,
  Play,
  Trash2,
  ImagePlus,
  Ban,
  List
} from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useUIStore } from '@/stores/useUIStore';
import { useVideoSourceSwitcher } from '@/hooks/useVideoSourceSwitcher';
import { formatMillisecondsToTime } from '@/utils/timelineUtils';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';
import { createRichTextFromPlainText } from '@/utils/textStyleUtils';

export function SubtitleList() {
  const { 
    currentTime, 
    setCurrentTime, 
    setIsPlaying, 
    playbackRate 
  } = useProjectStore();
  
  const { 
    subtitles,
    updateSubtitle,
    updateSubtitleRichText,
    deleteSubtitles,
  } = useSubtitleStore();
  
  const { 
    selectedSubtitleIds, 
    editingSubtitleId,
    setEditingSubtitle,
    setSelectedSubtitles,
    toggleSubtitleSelection,
    setActivePanel,
    setShowRichTextEditor,
    setRichTextEditorTarget,
    setRichTextSelection,
    clearSelectedSubtitles
  } = useUIStore();

  const { isInsertClip } = useVideoSourceSwitcher();
  const [localEditText, setLocalEditText] = useState("");
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [localStartTime, setLocalStartTime] = useState("");
  const [localEndTime, setLocalEndTime] = useState("");

  const currentTimeMs = currentTime * 1000;
  const stopPlaybackTimer = useRef<NodeJS.Timeout | null>(null);
  const textRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const currentSubtitle = useMemo(() => {
    if (isInsertClip) return null;
    return subtitles.find(s => currentTimeMs >= s.startTime && currentTimeMs < s.endTime);
  }, [currentTimeMs, subtitles, isInsertClip]);

  useEffect(() => {
    if (!currentSubtitle || !scrollContainerRef.current) return;
    
    const currentItemEl = itemRefs.current.get(currentSubtitle.id);
    if (!currentItemEl) return;

    const containerRect = scrollContainerRef.current.getBoundingClientRect();
    const itemRect = currentItemEl.getBoundingClientRect();

    const isVisible = 
      itemRect.top >= containerRect.top && 
      itemRect.bottom <= containerRect.bottom;

    if (!isVisible) {
      currentItemEl.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    
  }, [currentSubtitle]); 

  useEffect(() => {
    return () => {
      if (stopPlaybackTimer.current) {
        clearTimeout(stopPlaybackTimer.current);
      }
    };
  }, []);

  const clearPlaybackTimer = () => {
    if (stopPlaybackTimer.current) {
      clearTimeout(stopPlaybackTimer.current);
      stopPlaybackTimer.current = null;
    }
  };

 
  const parseTimeToMilliseconds = (timeStr: string): number | null => {
    try {
      const parts = timeStr.split(':');
      let totalMs = 0;
      let cs: string | undefined; // 声明 cs 变量
      let ss: string;

      if (parts.length === 3) { // HH:MM:SS.CS
        [ss, cs] = parts[2].split('.');
        totalMs += parseInt(parts[0], 10) * 3600 * 1000;
        totalMs += parseInt(parts[1], 10) * 60 * 1000;
        totalMs += parseInt(ss, 10) * 1000;
      } else if (parts.length === 2) { // MM:SS.CS
        [ss, cs] = parts[1].split('.');
        totalMs += parseInt(parts[0], 10) * 60 * 1000;
        totalMs += parseInt(ss, 10) * 1000;
      } else {
        return null;
      }

      if (cs) {
        totalMs += parseInt(cs.padEnd(2, '0').substring(0, 2), 10) * 10;
      }

      if (isNaN(totalMs)) return null;
      return totalMs;
    } catch (error) {
      console.error("Failed to parse time:", timeStr, error);
      return null;
    }
  };

  const handleSubtitleClick = (subtitleId: string, startTime: number, event: React.MouseEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        return;
      }
      clearPlaybackTimer();
      
      if (event.ctrlKey || event.metaKey) {
        toggleSubtitleSelection(subtitleId);
      } else {
        setSelectedSubtitles([subtitleId]);
        const validSplitTimeSec = (startTime / 1000) + 0.001;
        setCurrentTime(validSplitTimeSec);
        
        
        const subtitle = subtitles.find(s => s.id === subtitleId);
        if (subtitle) {
          setRichTextSelection({
            subtitleId: subtitle.id,
            startIndex: 0,
            endIndex: subtitle.text.length
          });
          setRichTextEditorTarget({ type: 'subtitle', id: subtitle.id });
        }
      }
      setEditingSubtitle(null);
      setEditingTimeId(null);
    };

  const handlePlay = (e: React.MouseEvent, sub: typeof subtitles[0]) => {
    e.stopPropagation();
    clearPlaybackTimer();

    const startTimeSec = sub.startTime / 1000;
    const endTimeSec = sub.endTime / 1000;
    const durationMs = (endTimeSec - startTimeSec) * 1000;
    const rate = playbackRate || 1;
    const adjustedDurationMs = durationMs / rate;

    setCurrentTime(startTimeSec);
    setIsPlaying(true);

    stopPlaybackTimer.current = setTimeout(() => {
      const { isPlaying, setIsPlaying } = useProjectStore.getState();
      if (isPlaying) {
        setIsPlaying(false);
      }
      stopPlaybackTimer.current = null;
    }, adjustedDurationMs);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    clearPlaybackTimer();
    clearSelectedSubtitles();
    setTimeout(() => {
    deleteSubtitles([id]);
    },0);
  };

  const handleMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearPlaybackTimer();
    setActivePanel('media');
  };

  const handleCancelEffect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    clearPlaybackTimer();

    const subtitle = subtitles.find(s => s.id === id);
    if (!subtitle) return;

    const newRichText = (subtitle.richText || createRichTextFromPlainText(subtitle.text))
      .map(segment => ({
        text: segment.text,
        style: { ...DEFAULT_SUBTITLE_STYLE },
        animation: undefined
      }));
    updateSubtitleRichText(id, newRichText);
  };

  const handleStartEditing = (e: React.MouseEvent, sub: typeof subtitles[0]) => {
    e.stopPropagation();
    clearPlaybackTimer();
    setEditingSubtitle(sub.id);
    setLocalEditText(sub.text);
    setEditingTimeId(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalEditText(e.target.value);
  };

  const handleTextBlur = (sub: typeof subtitles[0]) => {
    if (localEditText !== sub.text) {
      updateSubtitle(sub.id, { text: localEditText });
    }
    setEditingSubtitle(null);
  };

  const handleStartTimeEditing = (e: React.MouseEvent, sub: typeof subtitles[0]) => {
    e.stopPropagation();
    clearPlaybackTimer();
    setEditingTimeId(sub.id);
    setLocalStartTime(formatMillisecondsToTime(sub.startTime));
    setLocalEndTime(formatMillisecondsToTime(sub.endTime));
    setEditingSubtitle(null);
  };
  const saveTimeUpdates = (subId: string) => {
      const newStartTime = parseTimeToMilliseconds(localStartTime);
      const newEndTime = parseTimeToMilliseconds(localEndTime);

      const sub = subtitles.find(s => s.id === subId);
      if (!sub) return;

      let updates: Partial<typeof sub> = {};

      if (newStartTime !== null && newStartTime !== sub.startTime) {
        updates.startTime = newStartTime;
      }

  
      if (newEndTime !== null && newEndTime !== sub.endTime) {
        updates.endTime = newEndTime;
      }

      if (Object.keys(updates).length > 0) {
        updateSubtitle(subId, updates);
      }
    };

  const handleTimeBlur = (e: React.FocusEvent<HTMLDivElement>, subId: string) => {
    const currentTarget = e.currentTarget;
    setTimeout(() => {
      if (!currentTarget.contains(document.activeElement)) {
        saveTimeUpdates(subId);
        setEditingTimeId(null);
      }
    }, 0);
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, subId: string) => {
    if (e.key === 'Enter') {
      saveTimeUpdates(subId);
      setEditingTimeId(null);
    } else if (e.key === 'Escape') {
      setEditingTimeId(null);
    }
  };



  const handleTextMouseUp = (e: React.MouseEvent, subId: string) => {
    if (editingSubtitleId === subId) return;

    const selection = window.getSelection();
    const textEl = textRefs.current.get(subId);

    if (!selection || !textEl || !selection.rangeCount || !textEl.contains(selection.anchorNode)) {
      setRichTextSelection(null);
      return;
    }
    
    const text = selection.toString();
    if (text.length === 0) {
      if (!useUIStore.getState().showRichTextEditor) {
        setRichTextSelection(null);
      }
      return;
    }

    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(textEl);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    
    const startIndex = preSelectionRange.toString().length;
    const endIndex = startIndex + text.length;

    setRichTextSelection({ subtitleId: subId, startIndex, endIndex });
    setRichTextEditorTarget({ type: 'subtitle', id: subId });
    setShowRichTextEditor(true);
  };

  // 2. 替换空状态的 emoji
  if (!subtitles.length) {
    return (
      <div className="h-full flex items-center justify-center text-text-tertiary">
        <div className="text-center">
          <div className="text-4xl mb-2 opacity-50">
            <List />
          </div>
          <div className="text-sm">暂无字幕</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      <div className="p-4 border-b border-border-secondary flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-text-primary font-medium text-sm">字幕列表</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">{subtitles.length} 条</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        <div className="space-y-px">
          {subtitles.map((subtitle) => {
            const isSelected = selectedSubtitleIds.includes(subtitle.id);
            const isEditing = editingSubtitleId === subtitle.id;
            const isEditingTime = editingTimeId === subtitle.id;
            const isCurrent = currentSubtitle?.id === subtitle.id;

            return (
            <div
              key={subtitle.id}
              ref={(el) => {
                if (el) itemRefs.current.set(subtitle.id, el);
                else itemRefs.current.delete(subtitle.id);
              }}
              className={`
                relative px-4 py-3 cursor-pointer transition-all duration-150
                hover:bg-bg-tertiary/30 border-l-2
                ${isCurrent ? 'bg-accent-blue/20' : 'bg-transparent'}
                ${isSelected ? 'border-accent-purple' : 'border-transparent'}
              `}
              onClick={(e) => handleSubtitleClick(subtitle.id, subtitle.startTime, e)}
              onDoubleClick={(e) => handleStartEditing(e, subtitle)}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 flex flex-col min-w-0">
                  
                  {isEditingTime ? (
                    <div 
                      className="space-y-1"
                      onBlur={(e) => handleTimeBlur(e, subtitle.id)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-xs text-text-primary font-medium">
                        调整开始和结束时间
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={localStartTime}
                          onChange={(e) => setLocalStartTime(e.target.value)}
                          onKeyDown={(e) => handleTimeKeyDown(e, subtitle.id)}
                          className="w-20 px-1.5 py-0.5 text-xs bg-bg-tertiary border border-border-secondary rounded text-text-primary font-mono focus:outline-none focus:border-accent-purple"
                          autoFocus
                        />
                        <span className="text-xs text-text-disabled font-mono">-</span>
                        <input
                          type="text"
                          value={localEndTime}
                          onChange={(e) => setLocalEndTime(e.target.value)}
                          onKeyDown={(e) => handleTimeKeyDown(e, subtitle.id)}
                          className="w-20 px-1.5 py-0.5 text-xs bg-bg-tertiary border border-border-secondary rounded text-text-primary font-mono focus:outline-none focus:border-accent-purple"
                        />
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center gap-1.5"
                      onClick={(e) => handleStartTimeEditing(e, subtitle)}
                    >
                      <div className="text-xs text-text-tertiary font-mono leading-tight">
                        {formatMillisecondsToTime(subtitle.startTime)}
                      </div>
                      <span className="text-xs text-text-disabled font-mono">-&gt;</span>
                      <div className="text-xs text-text-disabled font-mono">
                        {formatMillisecondsToTime(subtitle.endTime)}
                      </div>
                    </div>
                  )}

                  <div className="min-w-0 mt-1.5">
                    {isEditing ? (
                      <textarea
                        value={localEditText}
                        onChange={handleTextChange}
                        onBlur={() => handleTextBlur(subtitle)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-2 py-1.5 text-sm bg-bg-tertiary border border-border-secondary rounded text-text-primary focus:outline-none whitespace-nowrap overflow-x-auto"
                        autoFocus
                        rows={1}
                      />
                    ) : (
                      <div 
                        ref={(el) => {
                          if (el) textRefs.current.set(subtitle.id, el);
                          else textRefs.current.delete(subtitle.id);
                        }}
                        className={`text-sm leading-relaxed break-words ${isCurrent ? 'text-text-primary font-medium' : 'text-text-secondary'}`}
                        onMouseUp={(e) => handleTextMouseUp(e, subtitle.id)}
                        contentEditable={false} 
                        suppressContentEditableWarning={true}
                        style={{ whiteSpace: 'pre-wrap' }}
                      >
                        {subtitle.text}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 3. 替换操作按钮的 emoji */}
                {isSelected && (
                <div className="flex-shrink-0 flex items-center gap-2 text-text-tertiary">
                  <button title="编辑" onClick={(e) => handleStartEditing(e, subtitle)} className="hover:text-text-primary">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button title="播放" onClick={(e) => handlePlay(e, subtitle)} className="hover:text-text-primary">
                    <Play className="w-4 h-4" />
                  </button>
                  <button title="删除" onClick={(e) => handleDelete(e, subtitle.id)} className="hover:text-accent-red">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button title="媒体" onClick={handleMedia} className="hover:text-text-primary">
                    <ImagePlus className="w-4 h-4" />
                  </button>
                  <button title="取消效果" onClick={(e) => handleCancelEffect(e, subtitle.id)} className="hover:text-text-primary">
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}