import React, { useMemo, useState, useRef } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';
import { DEFAULT_SUBTITLE_STYLE } from '../../types/subtitle';
import { SubtitleQuickToolbar } from './SubtitleQuickToolbar';

export function SubtitleOverlay() {
  const { 
    subtitles, 
    currentTime, 
    updateSubtitlePosition, 
    getSubtitlePosition 
  } = useProjectStore();
  const { selectedSubtitleIds, setSelectedSubtitles, setEditingSubtitle } = useUIStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [showQuickToolbar, setShowQuickToolbar] = useState(false);
  const subtitleRef = useRef<HTMLDivElement>(null);

  const currentSubtitle = useMemo(() => {
    if (!subtitles || !currentTime) return null;
    
    const currentTimeMs = currentTime * 1000;
    return subtitles.find(subtitle => {
      return currentTimeMs >= subtitle.startTime && currentTimeMs <= subtitle.endTime;
    });
  }, [subtitles, currentTime]);

  const isSelected = currentSubtitle ? selectedSubtitleIds.includes(currentSubtitle.id) : false;
  
  const subtitlePosition = currentSubtitle ? getSubtitlePosition(currentSubtitle.id) : { x: 50, y: 85 };
  
  const subtitleStyle = currentSubtitle?.style || DEFAULT_SUBTITLE_STYLE;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.detail === 2) return;
    
    e.preventDefault();
    if (!subtitleRef.current || !currentSubtitle) return;

    setSelectedSubtitles([currentSubtitle.id]);
    setShowQuickToolbar(true);
    setIsDragging(true);
    
    const rect = subtitleRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!subtitleRef.current || !currentSubtitle) return;
      
      const parent = subtitleRef.current.parentElement;
      if (!parent) return;
      
      const parentRect = parent.getBoundingClientRect();
      
      const newX = ((moveEvent.clientX - offsetX - parentRect.left) / parentRect.width) * 100;
      const newY = ((moveEvent.clientY - offsetY - parentRect.top) / parentRect.height) * 100;
      
      const clampedX = Math.max(0, Math.min(100, newX));
      const clampedY = Math.max(0, Math.min(100, newY));
      
      updateSubtitlePosition(currentSubtitle.id, clampedX, clampedY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClick = () => {
    if (currentSubtitle) {
      setEditingSubtitle(currentSubtitle.id);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {currentSubtitle && (
        <div 
          ref={subtitleRef}
          className={`
            absolute pointer-events-auto transition-all duration-200 ease-in-out
            ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab hover:scale-102'}
            ${isSelected ? 'ring-2 ring-accent-purple/50' : ''}
          `}
          style={{
            left: `${subtitlePosition.x}%`,
            top: `${subtitlePosition.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        >
          <div className={`
            inline-block px-4 py-2 text-center transition-all rounded
            ${isSelected 
              ? 'border-2 border-accent-purple shadow-lg shadow-accent-purple/20' 
              : 'border-2 border-transparent'
            }
          `}>
            <div 
              style={{
                fontFamily: subtitleStyle.fontFamily,
                fontSize: `${subtitleStyle.fontSize}px`,
                color: subtitleStyle.color,
                backgroundColor: subtitleStyle.backgroundColor,
                opacity: subtitleStyle.opacity,
                textAlign: subtitleStyle.alignment,
                textShadow: subtitleStyle.shadow.enabled 
                  ? `${subtitleStyle.shadow.offsetX}px ${subtitleStyle.shadow.offsetY}px ${subtitleStyle.shadow.blur}px ${subtitleStyle.shadow.color}`
                  : undefined,
                wordBreak: 'break-word',
                borderColor: subtitleStyle.borderColor,
                borderWidth: subtitleStyle.borderWidth ? `${subtitleStyle.borderWidth}px` : undefined,
                borderStyle: subtitleStyle.borderWidth ? 'solid' : undefined,
              }}
            >
              {currentSubtitle.text}
            </div>
            
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-purple rounded-full border-2 border-white"></div>
            )}
          </div>
        </div>
      )}
      
      {showQuickToolbar && currentSubtitle && isSelected && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <div className="pointer-events-auto">
            <SubtitleQuickToolbar
              subtitleId={currentSubtitle.id}
              position={subtitlePosition}
              onClose={() => setShowQuickToolbar(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}