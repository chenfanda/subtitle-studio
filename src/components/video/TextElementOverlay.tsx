import { useState, useRef, useMemo } from 'react';
import { useTextElementStore } from '@/stores/useTextElementStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUIStore } from '@/stores/useUIStore';
import { useVideoSourceSwitcher } from '@/hooks/useVideoSourceSwitcher';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { TransformBorder } from '../common/TransformBorder';
import { QuickToolbar } from './QuickToolbar';
import { convertStyleToCSS } from '@/utils/textStyleUtils';
import type { TextElement } from '@/types/textElement';

export function TextElementOverlay() {
  const { 
    textElements, 
    updateTextElementPosition,
    updateTextElementTransform
  } = useTextElementStore();
  const { currentTime } = useProjectStore();
  const { 
    selectedTextElementIds, 
    setSelectedTextElements,
    clearSelectedSubtitles,
    videoToolbar,
    setVideoToolbar,
    setVideoToolbarVisible,
    showRichTextEditor
  } = useUIStore();
  const { isInsertClip } = useVideoSourceSwitcher();
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);



  
  const visibleElements = useMemo(() => {

    if (isInsertClip) return [];
    const currentTimeMs = currentTime * 1000;
    return textElements.filter(el => {
      return currentTimeMs >= el.startTime && currentTimeMs <= el.endTime;
    });
  
  }, [textElements, currentTime, isInsertClip]);
  
  const handleElementClick = (element: TextElement, e: React.MouseEvent) => {
    if (e.detail === 2) return;
    
    e.preventDefault();
    
    setSelectedTextElements([element.id]);
    clearSelectedSubtitles();
    setVideoToolbar({
      visible: true,
      targetType: 'textElement',
      targetId: element.id
    });
  };
  
  const handleElementDrag = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setHasMoved(false);
    
    const element = textElements.find(el => el.id === id);
    if (!element) return;
    
    const container = (e.target as HTMLElement).closest('.video-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    
    const targetElement = e.currentTarget as HTMLElement;
    const targetRect = targetElement.getBoundingClientRect();
    const offsetX = e.clientX - targetRect.left;
    const offsetY = e.clientY - targetRect.top;
    
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY
    };
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!hasMoved && dragStartPos.current) {
        const deltaX = Math.abs(moveEvent.clientX - dragStartPos.current.x);
        const deltaY = Math.abs(moveEvent.clientY - dragStartPos.current.y);
        
        if (deltaX > 5 || deltaY > 5) {
          setHasMoved(true);
          useHistoryStore.getState().pushState();
        }
      }
      
      const newX = ((moveEvent.clientX - offsetX - rect.left) / rect.width) * 100;
      const newY = ((moveEvent.clientY - offsetY - rect.top) / rect.height) * 100;
      
      const clampedX = Math.max(0, Math.min(100, newX));
      const clampedY = Math.max(0, Math.min(100, newY));
      
      updateTextElementPosition(id, clampedX, clampedY);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setHasMoved(false);
      dragStartPos.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleCloseToolbar = () => {
    if (showRichTextEditor) {
      setVideoToolbarVisible(false);
    } else {
      setVideoToolbar({
        visible: false,
        targetType: null,
        targetId: null
      });
    }
  };
  
  const currentToolbarElement = visibleElements.find(
    el => videoToolbar.targetType === 'textElement' && videoToolbar.targetId === el.id
  );
  
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {visibleElements.map(element => {
        const isSelected = videoToolbar.targetType === 'textElement' && 
                          videoToolbar.targetId === element.id;
        
        return (
          <div
            key={element.id}
            className={`absolute pointer-events-auto transition-opacity ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              left: `${element.position.x}%`,
              top: `${element.position.y}%`,
              transform: `
                translate(-50%, -50%) 
                scaleX(${element.position.scaleX}) 
                scaleY(${element.position.scaleY}) 
                rotate(${element.position.rotation}deg)
              `
            }}
            onClick={(e) => handleElementClick(element, e)}
            onMouseDown={(e) => handleElementDrag(element.id, e)}
          >
            <TransformBorder
              isSelected={isSelected}
              position={element.position}
              mode="textElement"
              onTransformChange={(scaleX, scaleY, rotation) => {
                updateTextElementTransform(element.id, scaleX, scaleY, rotation || 0);
              }}
              minScale={0.3}
              maxScale={3.0}
            >
              <div 
                style={convertStyleToCSS(element.style)}
                className={`px-4 py-2 rounded inline-block ${
                  isSelected 
                    ? 'ring-2 ring-accent-purple' 
                    : ''
                }`}
              >
                {element.text}
              </div>
            </TransformBorder>
          </div>
        );
      })}
      
      {videoToolbar.visible && videoToolbar.targetType === 'textElement' && currentToolbarElement && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <div className="pointer-events-auto">
            <QuickToolbar
              targetType="textElement"
              targetId={currentToolbarElement.id}
              position={currentToolbarElement.position}
              onClose={handleCloseToolbar}
            />
          </div>
        </div>
      )}
    </div>
  );
}