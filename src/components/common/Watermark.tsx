import React, { useState, useRef } from 'react';
import type { WatermarkConfig } from '../../types/settings';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { WatermarkLogo } from './WatermarkLogo';

interface WatermarkProps {
  config: WatermarkConfig;
}

export function Watermark({ config }: WatermarkProps) {
  const { updateWatermark, switchToCustomPosition } = useSettingsStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, startY: 0, initialLeftPct: 0, initialTopPct: 0, parentWidth: 0, parentHeight: 0 });

  if (!config.enabled) return null;

  const getLayoutClasses = () => {
    const layout = config.layout || 'row';
    switch (layout) {
      case 'row': return 'flex flex-row space-x-2 items-center';
      case 'row-reverse': return 'flex flex-row-reverse space-x-reverse space-x-2 items-center';
      case 'col': return 'flex flex-col space-y-1 items-center';
      case 'col-reverse': return 'flex flex-col-reverse space-y-reverse space-y-1 items-center';
      case 'overlay': return 'grid place-items-center'; 
      default: return 'flex flex-row space-x-2 items-center';
    }
  };

  const getPositionStyle = (): React.CSSProperties => {
    if (isDragging && watermarkRef.current) {
      return { left: watermarkRef.current.style.left, top: watermarkRef.current.style.top };
    }
    if (config.positionMode === 'custom') {
      return { left: `${config.customPosition.x}%`, top: `${config.customPosition.y}%` };
    } else {
      const presetPositions: Record<string, { left: string, top: string }> = {
        'top-left': { left: '5%', top: '5%' },
        'top-right': { left: '85%', top: '5%' },
        'bottom-left': { left: '5%', top: '85%' },
        'bottom-right': { left: '85%', top: '85%' },
      };
      return presetPositions[config.position] || presetPositions['top-right'];
    }
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!watermarkRef.current) return;
    const parent = watermarkRef.current.parentElement;
    if (!parent) return;

    if (config.positionMode === 'preset') {
      switchToCustomPosition();
    }

    setIsDragging(true);
    const parentRect = parent.getBoundingClientRect();
    const rect = watermarkRef.current.getBoundingClientRect();
    
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialLeftPct: ((rect.left - parentRect.left + rect.width / 2) / parentRect.width) * 100,
      initialTopPct: ((rect.top - parentRect.top + rect.height / 2) / parentRect.height) * 100,
      parentWidth: parentRect.width,
      parentHeight: parentRect.height
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!watermarkRef.current) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    const deltaXPct = (deltaX / dragRef.current.parentWidth) * 100;
    const deltaYPct = (deltaY / dragRef.current.parentHeight) * 100;
    let newX = dragRef.current.initialLeftPct + deltaXPct;
    let newY = dragRef.current.initialTopPct + deltaYPct;
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));
    watermarkRef.current.style.left = `${newX}%`;
    watermarkRef.current.style.top = `${newY}%`;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    if (!watermarkRef.current) return;
    const finalLeft = parseFloat(watermarkRef.current.style.left || '0');
    const finalTop = parseFloat(watermarkRef.current.style.top || '0');
    const x = isNaN(finalLeft) ? dragRef.current.initialLeftPct : finalLeft;
    const y = isNaN(finalTop) ? dragRef.current.initialTopPct : finalTop;
    updateWatermark({ positionMode: 'custom', customPosition: { x, y } });
  };

  const watermarkStyle: React.CSSProperties = {
    position: 'absolute',
    fontFamily: config.fontFamily,
    fontSize: `${config.fontSize}px`,
    fontWeight: config.fontWeight || 400,
    fontStyle: config.fontStyle || 'normal',
    textDecoration: config.textDecoration || 'none',
    color: config.color,
    backgroundColor: config.backgroundColor,
    opacity: config.opacity / 100,
    userSelect: 'none',
    transform: 'translate(-50%, -50%)',
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: 30, 
    whiteSpace: 'nowrap',
    ...getPositionStyle(),
  };

  const layout = config.layout || 'row';
  const isOverlay = layout === 'overlay';

  return (
    <div 
      
      ref={watermarkRef}
      style={watermarkStyle}
      onMouseDown={handleMouseDown}
      className="group pointer-events-auto touch-none"
      title="拖拽调整位置"
    >
      <div 
        id="watermark-preview-node" 
        className={`backdrop-blur-sm rounded-lg px-3 py-2 border border-transparent hover:border-white/20 transition-colors ${getLayoutClasses()}`}
        style={{ transform: 'none' }} 
      >
        <div className={`relative flex-shrink-0 ${isOverlay ? 'col-start-1 row-start-1' : ''}`}>
          {config.imageUrl ? (
            <img 
              src={config.imageUrl} 
              alt="watermark" 
              className="object-contain select-none pointer-events-none"
              style={{ 
                height: `${config.fontSize * 1.5}px`,
                width: 'auto',
                maxWidth: '120px',
                display: 'block'
              }}
            />
          ) : (
            <div 
              style={{ 
                width: `${config.fontSize * 1.5}px`, 
                height: `${config.fontSize * 1.5}px`,
                color: config.backgroundColor.includes('rgba(0, 0, 0') ? '#ffffff' : '#000000' 
              }}
            >
              <WatermarkLogo />
            </div>
          )}
        </div>

        {config.text && (
          <span 
            className={`font-medium leading-none select-none ${isOverlay ? 'col-start-1 row-start-1 z-10 drop-shadow-md' : ''}`}
            style={isOverlay ? { 
              textShadow: '0 1px 2px rgba(0,0,0,0.8)' 
            } : {}}
          >
            {config.text}
          </span>
        )}
      </div>
    </div>
  );
}