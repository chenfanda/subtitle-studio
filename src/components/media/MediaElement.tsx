import { useState, useRef } from 'react';
import { useMediaStore } from '@/stores/useMediaStore';
import type { PlacedMediaItem } from '@/types/media';

interface MediaElementProps {
  item: PlacedMediaItem;
}

export function MediaElement({ item }: MediaElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  
  const { updateMediaPosition, removeMedia } = useMediaStore();

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!elementRef.current) return;

    setIsSelected(true);
    setIsDragging(true);
    
    const rect = elementRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!elementRef.current) return;
      
      const parent = elementRef.current.parentElement;
      if (!parent) return;
      
      const parentRect = parent.getBoundingClientRect();
      
      const newX = ((moveEvent.clientX - offsetX - parentRect.left) / parentRect.width) * 100;
      const newY = ((moveEvent.clientY - offsetY - parentRect.top) / parentRect.height) * 100;
      
      const clampedX = Math.max(0, Math.min(100, newX));
      const clampedY = Math.max(0, Math.min(100, newY));
      
      updateMediaPosition(item.media.id, clampedX, clampedY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeMedia(item.media.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelected(!isSelected);
  };

  return (
    <div 
      ref={elementRef}
      className={`
        absolute pointer-events-auto cursor-grab transition-all duration-200
        ${isDragging ? 'cursor-grabbing scale-105' : ''}
        ${isSelected ? 'ring-2 ring-accent-purple' : ''}
      `}
      style={{
        left: `${item.position.x}%`,
        top: `${item.position.y}%`,
        transform: `translate(-50%, -50%) scale(${item.position.scale}) rotate(${item.position.rotation}deg)`,
        zIndex: isSelected ? 15 : 10
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <img 
        src={item.media.url}
        alt=""
        className="max-w-24 max-h-24 object-contain"
        draggable={false}
      />
      
      {isSelected && (
        <>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-purple rounded-full border-2 border-white" />
          
          <button
            onClick={handleDelete}
            className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs transition-colors"
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}