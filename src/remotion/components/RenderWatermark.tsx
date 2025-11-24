import React from 'react';
import type { WatermarkConfig } from '@/types/settings';

// 🟢 1. 接口增加 scaleFactor
interface RenderWatermarkProps {
  config: WatermarkConfig;
  scaleFactor?: number; 
}

export const RenderWatermark: React.FC<RenderWatermarkProps> = ({ 
  config,
  scaleFactor = 1 
}) => {
  if (!config.enabled) return null;

  let positionStyle: React.CSSProperties = {};

  if (config.positionMode === 'custom') {
    positionStyle = {
      left: `${config.customPosition.x}%`,
      top: `${config.customPosition.y}%`,
      transform: 'translate(-50%, -50%)',
    };
  } else {
    // 🟢 2. 放大边距
    const margin = `${20 * scaleFactor}px`;
    switch (config.position) {
      case 'top-left': positionStyle = { top: margin, left: margin }; break;
      case 'top-right': positionStyle = { top: margin, right: margin }; break;
      case 'bottom-left': positionStyle = { bottom: margin, left: margin }; break;
      case 'bottom-right': positionStyle = { bottom: margin, right: margin }; break;
    }
  }

  // 🟢 3. 放大各项尺寸
  const finalFontSize = config.fontSize * scaleFactor;
  const finalPaddingH = 8 * scaleFactor;
  const finalPaddingV = 4 * scaleFactor;
  const finalRadius = 4 * scaleFactor;

  const style: React.CSSProperties = {
    position: 'absolute',
    fontSize: `${finalFontSize}px`,
    fontFamily: config.fontFamily,
    color: config.color,
    opacity: config.opacity / 100,
    backgroundColor: config.backgroundColor,
    padding: config.backgroundColor !== 'transparent' ? `${finalPaddingV}px ${finalPaddingH}px` : '0',
    borderRadius: `${finalRadius}px`,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: 100,
    ...positionStyle,
  };

  return (
    <div style={style}>
      {config.text}
    </div>
  );
};