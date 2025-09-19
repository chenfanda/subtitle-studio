// src/components/timeline/PlayheadIndicator.tsx
import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTimelineStore } from '@/stores/useTimelineStore';

export function PlayheadIndicator() {
  const { currentTime, setCurrentTime, duration, isPlaying } = useProjectStore();
  const { pixelsPerSecond, scrollPosition, setScrollPosition, viewportWidth } = useTimelineStore();
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算播放头位置：currentTime(秒) × 每秒像素数 - 滚动偏移
  const playheadPosition = (currentTime || 0) * pixelsPerSecond - scrollPosition;

  // 自动跟随播放进度滚动 - 优化版本
  useEffect(() => {
    if (!isPlaying || isDragging) return;

    // 使用节流，避免频繁更新
    const timeoutId = setTimeout(() => {
      const currentPixelPosition = (currentTime || 0) * pixelsPerSecond;
      const visibleStart = scrollPosition;
      const visibleEnd = scrollPosition + (viewportWidth || 800);
      
      // 增加更大的缓冲区，减少滚动频率
      const leftBuffer = 200;
      const rightBuffer = 200;
      
      let needsScroll = false;
      let newScrollPosition = scrollPosition;
      
      // 只在播放头真正超出缓冲区时才滚动
      if (currentPixelPosition < visibleStart + leftBuffer) {
        newScrollPosition = Math.max(0, currentPixelPosition - 300);
        needsScroll = true;
      } else if (currentPixelPosition > visibleEnd - rightBuffer) {
        newScrollPosition = currentPixelPosition - (viewportWidth || 800) + 300;
        needsScroll = true;
      }
      
      // 只有真正需要滚动时才更新状态
      if (needsScroll && Math.abs(newScrollPosition - scrollPosition) > 10) {
        requestAnimationFrame(() => {
          setScrollPosition(newScrollPosition);
        });
      }
    }, 100); // 100ms节流

    return () => clearTimeout(timeoutId);
  }, [currentTime, isPlaying, isDragging]); // 减少依赖项

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
      className="absolute inset-0 pointer-events-auto"
      onClick={handleTimelineClick}
    >
      {/* 播放头指示线 */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-accent-red z-30"
        style={{ left: playheadPosition }}
      >
        {/* 播放头拖拽手柄 */}
        <div 
          className={`
            absolute -top-1 w-4 h-4 bg-accent-red rounded-full 
            transform -translate-x-1/2 cursor-grab hover:scale-110
            transition-transform duration-150 pointer-events-auto
            ${isDragging ? 'scale-110 cursor-grabbing' : ''}
          `}
          style={{ 
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
          }}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  );
}