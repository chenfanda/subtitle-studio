import { useState, useRef } from 'react';
import { useMediaStore } from '@/stores/useMediaStore';
import { TransformBorder } from '../common/TransformBorder';
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
      
      updateMediaPosition(
        item.media.id, 
        clampedX, 
        clampedY, 
        item.position.scaleX,
        item.position.scaleY,
        item.position.rotation
      );
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
      className={`absolute pointer-events-auto cursor-grab transition-all duration-200 ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
      style={{
        left: `${item.position.x}%`,
        top: `${item.position.y}%`,
        transform: `translate(-50%, -50%) scale(${item.position.scaleX}, ${item.position.scaleY}) rotate(${item.position.rotation}deg)`,
        zIndex: isSelected ? 15 : 10
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <TransformBorder
        isSelected={isSelected}
        position={{ 
          x: item.position.x, 
          y: item.position.y,
          scaleX: item.position.scaleX,
          scaleY: item.position.scaleY
        }}
        mode="media"
        onTransformChange={(scaleX, scaleY) => {
          updateMediaPosition(
            item.media.id,
            item.position.x,
            item.position.y,
            scaleX,
            scaleY,
            item.position.rotation
          );
        }}
        minScale={0.3}
        maxScale={5.0}
      >
        <img 
          src={item.media.url}
          alt=""
          className="w-24 h-24 object-contain"
          draggable={false}
        />
      </TransformBorder>
      
      {isSelected && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs transition-colors z-20"
        >
          ×
        </button>
      )}
    </div>
  );
}