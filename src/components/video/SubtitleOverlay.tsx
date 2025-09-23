import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';
import { DEFAULT_SUBTITLE_STYLE } from '../../types/subtitle';
import { SubtitleQuickToolbar } from './SubtitleQuickToolbar';
import { convertToWebAnimation } from '../../utils/animationUtils';
import { convertStyleToCSS } from '../../utils/textStyleUtils';
import type { RichTextSegment } from '../../types/subtitle';

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
  const [segmentAnimations, setSegmentAnimations] = useState<Map<number, Animation>>(new Map());
  const subtitleRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<Map<number, HTMLElement>>(new Map());

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

  // 渲染富文本内容
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
    
    // 回退到纯文本渲染
    return (
      <span style={convertStyleToCSS(subtitleStyle)}>
        {currentSubtitle.text}
      </span>
    );
  };

  // 播放片段动效
  const playSegmentAnimations = () => {
    if (!currentSubtitle?.richText) return;
    
    // 清除之前的动画
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
      
      // 如果是入场动画，播放完成后保持状态
      if (segment.animation.type === 'entrance') {
        animation.onfinish = () => {
          // 动画完成后保持最终状态
        };
      }
    });
    
    setSegmentAnimations(newAnimations);
  };

  // 停止所有动画
  const stopAllAnimations = () => {
    segmentAnimations.forEach(animation => {
      animation.cancel();
    });
    setSegmentAnimations(new Map());
  };

  // 当字幕变化时播放动效
  useEffect(() => {
    if (currentSubtitle && currentSubtitle.richText) {
      // 延迟一下确保DOM元素已渲染
      setTimeout(() => {
        playSegmentAnimations();
      }, 50);
    } else {
      stopAllAnimations();
    }

    return () => stopAllAnimations();
  }, [currentSubtitle?.id]);

  // 清理函数
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
              className="subtitle-content"
              style={{
                wordBreak: 'break-word',
                textAlign: subtitleStyle.alignment,
              }}
            >
              {renderRichTextContent()}
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