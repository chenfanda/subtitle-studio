import React from 'react';
import { Img } from 'remotion';
import type { PlacedMediaItem } from '@/types/media';

interface RenderMediaProps {
  item: PlacedMediaItem;
  scaleFactor?: number;
}

export const RenderMedia: React.FC<RenderMediaProps> = ({ 
  item,
  scaleFactor = 1 
}) => {
  const { position, media } = item;
  
  const hasWidthPercent = typeof position.width === 'number' && position.width > 0;

  const finalScaleX = hasWidthPercent ? position.scaleX : position.scaleX * scaleFactor;
  const finalScaleY = hasWidthPercent ? position.scaleY : position.scaleY * scaleFactor;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${position.x}%`,
    top: `${position.y}%`,
    width: hasWidthPercent ? `${position.width}%` : `${media.width}px`,
    height: 'auto',
    transform: `translate(-50%, -50%) scaleX(${finalScaleX}) scaleY(${finalScaleY}) rotate(${position.rotation}deg)`,
    pointerEvents: 'none',
  };

  return (
    <div style={style}>
      <Img 
        src={media.url} 
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};