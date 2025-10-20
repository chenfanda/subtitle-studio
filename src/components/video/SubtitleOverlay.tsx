import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUIStore } from '@/stores/useUIStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';
import { QuickToolbar } from './QuickToolbar';
import { TransformBorder } from '../common/TransformBorder';
import { convertToWebAnimation } from '@/utils/animationUtils';
import { convertStyleToCSS } from '@/utils/textStyleUtils';
import type { RichTextSegment } from '@/types/subtitle';

export function SubtitleOverlay() {
  const { 
    subtitles, 
    updateSubtitlePosition,
    updateSubtitleScale,
    updateSubtitleWidth,
    getSubtitlePosition 
  } = useSubtitleStore();
  const { currentTime } = useProjectStore();
  const { 
    selectedSubtitleIds, 
    setSelectedSubtitles, 
    clearSelectedTextElements,
    videoToolbar,
    setVideoToolbar,
    setVideoToolbarVisible,
    showRichTextEditor
  } = useUIStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [segmentAnimations, setSegmentAnimations] = useState<Map<number, Animation>>(new Map());
  const subtitleRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<Map<number, HTMLElement>>(new Map());
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const currentSubtitle = useMemo(() => {
    if (!subtitles || !currentTime) return null;
    
    const currentTimeMs = currentTime * 1000;
    return subtitles.find(subtitle => {
      return currentTimeMs >= subtitle.startTime && currentTimeMs <= subtitle.endTime;
    });
  }, [subtitles, currentTime]);

  const isSelected = videoToolbar.targetType === 'subtitle' && 
                     videoToolbar.targetId === currentSubtitle?.id;
  
  const shouldShowToolbar = isSelected && videoToolbar.visible;
  
  const subtitlePosition = currentSubtitle ? getSubtitlePosition(currentSubtitle.id) : { x: 50, y: 85, scale: 1.0, width: undefined };
  
  const subtitleStyle = currentSubtitle?.style || DEFAULT_SUBTITLE_STYLE;

  const renderRichTextContent = () => {
    if (!currentSubtitle) return null;
    
    if (currentSubtitle.richText) {
      return currentSubtitle.richText.map((segment, index) => (
        <span
          key={index}
          ref={(el) => {
            if (el) {
              segmentRefs.current.set(index, el);
            } else {
              segmentRefs.current.delete(index);
            }
          }}
          style={convertStyleToCSS(segment.style)}
          data-segment-index={index}
          data-animation={segment.animation?.name || ''}
        >
          {segment.text}
        </span>
      ));
    }
    
    return (
      <span style={convertStyleToCSS(subtitleStyle)}>
        {currentSubtitle.text}
      </span>
    );
  };

  const playSegmentAnimations = () => {
    if (!currentSubtitle?.richText) return;
    
    stopAllAnimations();
    
    const newAnimations = new Map<number, Animation>();
    
    currentSubtitle.richText.forEach((segment, index) => {
      if (!segment.animation) return;
      
      const element = segmentRefs.current.get(index);
      if (!element) return;
      
      const keyframes = convertToWebAnimation(segment.animation);
      const options: KeyframeAnimationOptions = {
        duration: segment.animation.duration,
        easing: segment.animation.easing || 'ease',
        iterations: segment.animation.type === 'continuous' ? Infinity : 1,
        fill: 'both',
        delay: segment.animation.delay || 0
      };
      
      const animation = element.animate(keyframes, options);
      newAnimations.set(index, animation);
      
      if (segment.animation.type === 'entrance') {
        animation.onfinish = () => {};
      }
    });
    
    setSegmentAnimations(newAnimations);
  };

  const stopAllAnimations = () => {
    segmentAnimations.forEach(animation => {
      animation.cancel();
    });
    setSegmentAnimations(new Map());
  };

  useEffect(() => {
    if (currentSubtitle && currentSubtitle.richText) {
      setTimeout(() => {
        playSegmentAnimations();
      }, 50);
    } else {
      stopAllAnimations();
    }

    return () => stopAllAnimations();
  }, [currentSubtitle?.id]);

  useEffect(() => {
    return () => {
      stopAllAnimations();
      segmentRefs.current.clear();
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.detail === 2) return;
    
    e.preventDefault();
    if (!subtitleRef.current || !currentSubtitle) return;

    setSelectedSubtitles([currentSubtitle.id]);
    clearSelectedTextElements();
    setVideoToolbar({
      visible: true,
      targetType: 'subtitle',
      targetId: currentSubtitle.id
    });
    setIsDragging(true);
    setHasMoved(false);
    
    const rect = subtitleRef.current.getBoundingClientRect();
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY
    };
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!subtitleRef.current || !currentSubtitle) return;
      
      if (!hasMoved && dragStartPos.current) {
        const deltaX = Math.abs(moveEvent.clientX - dragStartPos.current.x);
        const deltaY = Math.abs(moveEvent.clientY - dragStartPos.current.y);
        
        if (deltaX > 5 || deltaY > 5) {
          setHasMoved(true);
          useHistoryStore.getState().pushState();
        }
      }
      
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
      setHasMoved(false);
      dragStartPos.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClick = () => {
    if (currentSubtitle) {
      const { setEditingSubtitle } = useUIStore.getState();
      setEditingSubtitle(currentSubtitle.id);
    }
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

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {currentSubtitle && (
        <div 
          ref={subtitleRef}
          className={`
            absolute pointer-events-auto transition-all duration-200 ease-in-out
            ${isDragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-102'}
          `}
          style={{
            left: `${subtitlePosition.x}%`,
            top: `${subtitlePosition.y}%`,
            transform: `translate(-50%, -50%) scale(${subtitlePosition.scale || 1.0})`,
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        >
          <TransformBorder
            isSelected={isSelected}
            position={{ x: subtitlePosition.x, y: subtitlePosition.y, scale: subtitlePosition.scale || 1.0 }}
            width={subtitlePosition.width}
            mode="subtitle"
            onScaleChange={(scale) => {
              if (currentSubtitle) {
                updateSubtitleScale(currentSubtitle.id, scale);
              }
            }}
            onWidthChange={(width) => {
              if (currentSubtitle) {
                updateSubtitleWidth(currentSubtitle.id, width);
              }
            }}
            minScale={0.5}
            maxScale={2.0}
          >
            <div 
              className={`
                inline-block px-4 py-2 text-center transition-all rounded
                ${isSelected 
                  ? 'border-2 border-accent-purple shadow-lg shadow-accent-purple/20' 
                  : 'border-2 border-transparent'
                }
              `}
              style={{
                width: subtitlePosition.width ? `${subtitlePosition.width}px` : 'auto',
              }}
            >
              <div 
                className="subtitle-content"
                style={{
                  wordBreak: 'break-word',
                  textAlign: subtitleStyle.alignment,
                }}
              >
                {renderRichTextContent()}
              </div>
            </div>
          </TransformBorder>
        </div>
      )}
      
      {shouldShowToolbar && currentSubtitle && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <div className="pointer-events-auto">
            <QuickToolbar
              targetType="subtitle"
              targetId={currentSubtitle.id}
              position={subtitlePosition}
              onClose={handleCloseToolbar}
            />
          </div>
        </div>
      )}
    </div>
  );
}