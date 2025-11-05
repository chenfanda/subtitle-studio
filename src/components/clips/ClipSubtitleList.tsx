import React, { useMemo, useRef, useEffect } from 'react';
import {
  Play,
  Trash2,
  ImagePlus,
  Mic,
  Scissors,
  Copy,
  PlusSquare,
  Combine,
  XCircle,
} from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useUIStore } from '@/stores/useUIStore';
import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { formatMillisecondsToTime } from '@/utils/timelineUtils';
import type { SubtitleItem } from '@/types/subtitle';

export function ClipSubtitleList() {
  const { 
    currentTime, 
    setCurrentTime, 
    setIsPlaying, 
    playbackRate 
  } = useProjectStore();
  
  const { 
    subtitles,
    deleteSubtitles,
    duplicateSubtitle,
    insertBlankSubtitle,
    splitSubtitle,
    mergeSubtitles,
  } = useSubtitleStore();
  
  const { addCutMarker } = useVideoSequenceStore();
  
  const { 
    selectedSubtitleIds, 
    setSelectedSubtitles,
    toggleSubtitleSelection,
    clearSelectedSubtitles,
    activeClipTask,
    setActivePanel,
  } = useUIStore();

  const currentTimeMs = currentTime * 1000;
  const stopPlaybackTimer = useRef<NodeJS.Timeout | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const currentSubtitle = useMemo(() => {
    return subtitles.find(s => currentTimeMs >= s.startTime && currentTimeMs < s.endTime);
  }, [currentTimeMs, subtitles]);

  const canSplit = useMemo(() => {
    if (selectedSubtitleIds.length !== 1) return false;
    const subtitle = subtitles.find(s => s.id === selectedSubtitleIds[0]);
    if (!subtitle) return false;
    return currentTimeMs > subtitle.startTime && currentTimeMs < subtitle.endTime;
  }, [selectedSubtitleIds, subtitles, currentTimeMs]);

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

  const handleSubtitleClick = (subtitleId: string, startTime: number, event: React.MouseEvent) => {
    clearPlaybackTimer();
    
    if (event.ctrlKey || event.metaKey) {
      toggleSubtitleSelection(subtitleId);
    } else {
      setSelectedSubtitles([subtitleId]);
      const validSplitTimeSec = (startTime / 1000) + 0.001;
      setCurrentTime(validSplitTimeSec);
    }
  };

  const handlePlay = (e: React.MouseEvent, sub: SubtitleItem) => {
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedSubtitleIds.length === 0) return;

    if (activeClipTask === 'videos') {
      const selectedSubs = subtitles.filter(s => selectedSubtitleIds.includes(s.id));
      useHistoryStore.getState().startBatch();
      for (const sub of selectedSubs) {
        addCutMarker(sub.startTime, sub.endTime);
      }
      useHistoryStore.getState().endBatch();
    } else {
      deleteSubtitles(selectedSubtitleIds);
    }
    
    clearSelectedSubtitles();
  };

  const handleAddBroll = (e: React.MouseEvent, subtitleId: string) => {
    e.stopPropagation();
    setSelectedSubtitles([subtitleId]);
    setActivePanel('broll');
  };
  
  const handleAddVoiceover = (e: React.MouseEvent, subtitleId: string) => {
    e.stopPropagation();
    setSelectedSubtitles([subtitleId]);
    setActivePanel('audio');
  };
  
  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedSubtitleIds.length === 1) {
      duplicateSubtitle(selectedSubtitleIds[0]);
    }
  };

  const handleInsertBlank = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedSubtitleIds.length === 1) {
      insertBlankSubtitle(selectedSubtitleIds[0]);
    }
  };

  const handleSplit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canSplit) {
      splitSubtitle(selectedSubtitleIds[0], currentTimeMs);
    }
  };

  const handleMerge = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedSubtitleIds.length > 1) {
      mergeSubtitles(selectedSubtitleIds);
      clearSelectedSubtitles();
    }
  };

  if (!subtitles.length) {
    return (
      <div className="h-full flex items-center justify-center text-text-tertiary">
        <div className="text-center">
          <div className="text-4xl mb-2 opacity-50"><Scissors /></div>
          <div className="text-sm">暂无字幕</div>
          <p className="text-xs mt-1">没有字幕无法进行剪辑</p>
        </div>
      </div>
    );
  }

  const isLayerMode = activeClipTask === 'subtitles';
  const isAtomicMode = activeClipTask === 'videos';

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      <div className="p-3 border-b border-border-secondary flex-shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          
          {/* --- 更改开始 --- */}
          {/* 仅在 'subtitles' (isLayerMode) 模式下显示这些按钮 */}
          {isLayerMode && (
            <>
              <button
                onClick={handleDuplicate}
                disabled={selectedSubtitleIds.length !== 1}
                title="复制"
                className="p-1.5 rounded text-text-primary hover:bg-bg-tertiary disabled:text-text-disabled disabled:hover:bg-transparent transition-colors"
              >
                <Copy size={18} />
              </button>
              <button
                onClick={handleInsertBlank}
                disabled={selectedSubtitleIds.length !== 1}
                title="插入片段"
                className="p-1.5 rounded text-text-primary hover:bg-bg-tertiary disabled:text-text-disabled disabled:hover:bg-transparent transition-colors"
              >
                <PlusSquare size={18} />
              </button>
              
              <div className="w-px h-4 bg-border-secondary mx-1" />

              <button
                onClick={handleSplit}
                disabled={!canSplit}
                title="分割"
                className="p-1.5 rounded text-text-primary hover:bg-bg-tertiary disabled:text-text-disabled disabled:hover:bg-transparent transition-colors"
              >
                <Scissors size={18} />
              </button>
              <button
                onClick={handleMerge}
                disabled={selectedSubtitleIds.length < 2}
                title="合并"
                className="p-1.5 rounded text-text-primary hover:bg-bg-tertiary disabled:text-text-disabled disabled:hover:bg-transparent transition-colors"
              >
                <Combine size={18} />
              </button>
              
              <div className="w-px h-4 bg-border-secondary mx-1" />
            </>
          )}
          {/* --- 更改结束 --- */}
          
          {/* 以下是两种模式共用的按钮 */}
          <button
            onClick={handleDelete}
            disabled={selectedSubtitleIds.length === 0}
            title={isAtomicMode ? "删除视频片段" : "删除字幕"}
            className="p-1.5 rounded text-accent-red hover:bg-accent-red/10 disabled:text-text-disabled disabled:hover:bg-transparent transition-colors"
          >
            <Trash2 size={18} />
          </button>
          
          <button
            onClick={() => clearSelectedSubtitles()}
            disabled={selectedSubtitleIds.length === 0}
            title="取消选择"
            className="p-1.5 rounded text-text-tertiary hover:bg-bg-tertiary disabled:text-text-disabled disabled:hover:bg-transparent transition-colors"
          >
            <XCircle size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        <div className="space-y-px">
          {subtitles.map((subtitle) => {
            const isSelected = selectedSubtitleIds.includes(subtitle.id);
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
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="text-xs text-text-tertiary font-mono leading-tight">
                      {formatMillisecondsToTime(subtitle.startTime)}
                    </div>
                    <span className="text-xs text-text-disabled font-mono">-&gt;</span>
                    <div className="text-xs text-text-disabled font-mono">
                      {formatMillisecondsToTime(subtitle.endTime)}
                    </div>
                  </div>

                  <div className="min-w-0 mt-1.5">
                    <div 
                      className={`text-sm leading-relaxed break-words ${isCurrent ? 'text-text-primary font-medium' : 'text-text-secondary'}`}
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {subtitle.text}
                    </div>
                  </div>
                </div>
                
                {isLayerMode && isSelected && (
                  <div className="flex-shrink-0 flex flex-row items-center gap-2 text-text-tertiary">
                    <button 
                      title="播放" 
                      onClick={(e) => handlePlay(e, subtitle)} 
                      className="p-1 rounded hover:text-text-primary"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button 
                      title="添加 B-roll" 
                      onClick={(e) => handleAddBroll(e, subtitle.id)} 
                      className="p-1 rounded hover:text-text-primary"
                    >
                      <ImagePlus className="w-4 h-4" />
                    </button>
                    <button 
                      title="添加配音" 
                      onClick={(e) => handleAddVoiceover(e, subtitle.id)} 
                      className="p-1 rounded hover:text-text-primary"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {isAtomicMode && isSelected && (
                  <div className="flex-shrink-0 flex flex-row items-center gap-2 text-text-tertiary">
                    <button 
                      title="播放" 
                      onClick={(e) => handlePlay(e, subtitle)} 
                      className="p-1 rounded hover:text-text-primary"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button 
                      title="删除视频片段"
                      onClick={(e) => {
                        e.stopPropagation();
                        addCutMarker(subtitle.startTime, subtitle.endTime);
                      }}
                      className="p-1 rounded hover:text-accent-red"
                    >
                      <Trash2 className="w-4 h-4" />
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