import React, { useMemo, useState, useRef } from 'react';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUIStore } from '@/stores/useUIStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { QuickToolbar } from './QuickToolbar';
import { TransformBorder } from '../common/TransformBorder';
import { useVideoSourceSwitcher } from '@/hooks/useVideoSourceSwitcher';
import { SubtitleScene } from './SubtitleScene';

export function SubtitleOverlay() {
  const { subtitles, updateSubtitlePosition, updateSubtitleScale, updateSubtitleWidth, getSubtitlePosition } = useSubtitleStore();
  const { currentTime } = useProjectStore();
  const { isInsertClip } = useVideoSourceSwitcher();
  const { setSelectedSubtitles, clearSelectedTextElements, videoToolbar, setVideoToolbar, setVideoToolbarVisible, setRichTextSelection, setRichTextEditorTarget } = useUIStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const currentSubtitle = useMemo(() => {
    if (!subtitles || typeof currentTime !== 'number') return null;
    const currentTimeMs = currentTime * 1000;
    return subtitles.find(s => currentTimeMs >= s.startTime && currentTimeMs < s.endTime);
  }, [subtitles, currentTime]);

  const isSelected = videoToolbar.targetType === 'subtitle' && videoToolbar.targetId === currentSubtitle?.id;
  const subtitlePosition = currentSubtitle ? getSubtitlePosition(currentSubtitle.id) : { x: 50, y: 85, scale: 1.0, width: undefined };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.detail === 2 || !subtitleRef.current || !currentSubtitle) return;
    e.preventDefault();
    setSelectedSubtitles([currentSubtitle.id]);
    setVideoToolbar({ visible: true, targetType: 'subtitle', targetId: currentSubtitle.id });
    setRichTextSelection({ subtitleId: currentSubtitle.id, startIndex: 0, endIndex: currentSubtitle.text.length });
    setRichTextEditorTarget({ type: 'subtitle', id: currentSubtitle.id });
    setIsDragging(true);
    setHasMoved(false);
    const rect = subtitleRef.current.getBoundingClientRect();
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!subtitleRef.current || !currentSubtitle) return;
      if (!hasMoved && dragStartPos.current && (Math.abs(moveEvent.clientX - dragStartPos.current.x) > 5 || Math.abs(moveEvent.clientY - dragStartPos.current.y) > 5)) {
        setHasMoved(true);
        useHistoryStore.getState().pushState();
      }
      const parentRect = subtitleRef.current.parentElement?.getBoundingClientRect();
      if (parentRect) {
        const newX = ((moveEvent.clientX - offsetX - parentRect.left) / parentRect.width) * 100;
        const newY = ((moveEvent.clientY - offsetY - parentRect.top) / parentRect.height) * 100;
        updateSubtitlePosition(currentSubtitle.id, Math.max(0, Math.min(100, newX)), Math.max(0, Math.min(100, newY)));
      }
    };
    const handleMouseUp = () => { setIsDragging(false); document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {currentSubtitle && !isInsertClip && (
        <div ref={subtitleRef} className={`absolute pointer-events-auto transition-all duration-200 ease-in-out ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ left: `${subtitlePosition.x}%`, top: `${subtitlePosition.y}%`, transform: `translate(-50%, -50%) scale(${subtitlePosition.scale || 1.0})` }}
          onMouseDown={handleMouseDown}
          onDoubleClick={() => useUIStore.getState().setEditingSubtitle(currentSubtitle.id)}
        >
          <TransformBorder isSelected={isSelected} position={{ ...subtitlePosition, scale: subtitlePosition.scale || 1.0 }} width={subtitlePosition.width} mode="subtitle" onScaleChange={(s) => updateSubtitleScale(currentSubtitle.id, s)} onWidthChange={(w) => updateSubtitleWidth(currentSubtitle.id, w)}>
            <div className={`inline-block transition-all rounded flex flex-col justify-center items-center ${isSelected ? 'border-2 border-accent-purple shadow-lg' : 'border-2 border-transparent'}`}
              style={{ width: subtitlePosition.width ? `${subtitlePosition.width}px` : 'auto', minWidth: '330px', minHeight: '100px', overflow: 'visible' }}>
              {/* 🟢 关键：SubtitleScene 现在被包裹在居中容器内，且不再自作主张缩放 */}
              <SubtitleScene subtitle={currentSubtitle} currentTime={currentTime} />
            </div>
          </TransformBorder>
        </div>
      )}
      {isSelected && videoToolbar.visible && currentSubtitle && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <div className="pointer-events-auto">
            <QuickToolbar targetType="subtitle" targetId={currentSubtitle.id} position={subtitlePosition} onClose={() => setVideoToolbarVisible(false)} />
          </div>
        </div>
      )}
    </div>
  );
}