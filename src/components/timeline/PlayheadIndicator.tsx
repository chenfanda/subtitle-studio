import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTimelineStore } from '@/stores/useTimelineStore';

export function PlayheadIndicator() {
  const { currentTime, setCurrentTime, duration, isPlaying } = useProjectStore();
  const { pixelsPerSecond, scrollPosition, setScrollPosition, viewportWidth } = useTimelineStore();
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const playheadPosition = (currentTime || 0) * pixelsPerSecond - scrollPosition;

  useEffect(() => {
    if (!isPlaying || isDragging) return;

    const timeoutId = setTimeout(() => {
      const currentPixelPosition = (currentTime || 0) * pixelsPerSecond;
      const visibleStart = scrollPosition;
      const visibleEnd = scrollPosition + (viewportWidth || 800);
      
      const leftBuffer = 200;
      const rightBuffer = 200;
      
      let needsScroll = false;
      let newScrollPosition = scrollPosition;
      
      if (currentPixelPosition < visibleStart + leftBuffer) {
        newScrollPosition = Math.max(0, currentPixelPosition - 300);
        needsScroll = true;
      } else if (currentPixelPosition > visibleEnd - rightBuffer) {
        newScrollPosition = currentPixelPosition - (viewportWidth || 800) + 300;
        needsScroll = true;
      }
      
      if (needsScroll && Math.abs(newScrollPosition - scrollPosition) > 10) {
        requestAnimationFrame(() => {
          setScrollPosition(newScrollPosition);
        });
      }
    }, 100); 

    return () => clearTimeout(timeoutId);
  }, [currentTime, isPlaying, isDragging]); 

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current || !duration) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = moveEvent.clientX - rect.left;
      const timelineX = clientX + scrollPosition;
      const newTime = Math.max(0, Math.min(duration, timelineX / pixelsPerSecond));
      
      setCurrentTime(newTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    if (!containerRef.current || !duration) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const timelineX = clientX + scrollPosition;
    const newTime = Math.max(0, Math.min(duration, timelineX / pixelsPerSecond));
    
    setCurrentTime(newTime);
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none" 
      onClick={handleTimelineClick} 
    >
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white z-30"
        style={{ left: playheadPosition }}
      >
        <div 
          className={`
            absolute -top-1 w-4 h-4 bg-white rounded-full
            transform -translate-x-1/2 cursor-grab hover:scale-110
            transition-transform duration-150 pointer-events-auto 
            ${isDragging ? 'scale-110 cursor-grabbing' : ''}
          `}
          style={{ 
            boxShadow: '0 2px 8px rgba(255, 255, 255, 0.4)'
          }}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  );
}