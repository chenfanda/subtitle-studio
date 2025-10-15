import { useRef } from 'react';

interface TransformBorderProps {
  isSelected: boolean;
  position: { x: number; y: number; scaleX?: number; scaleY?: number; scale?: number; rotation?: number };
  width?: number;
  mode: 'subtitle' | 'media' | 'textElement';
  onPositionChange?: (x: number, y: number) => void;
  onScaleChange?: (scale: number) => void;
  onWidthChange?: (width: number) => void;
  onTransformChange?: (scaleX: number, scaleY: number, rotation?: number) => void;
  minScale?: number;
  maxScale?: number;
  children: React.ReactNode;
}

type HandleType = 'nw' | 'ne' | 'sw' | 'se' | 'left' | 'right' | 'top' | 'bottom';

export function TransformBorder({
  isSelected,
  position,
  width,
  mode,
  onPositionChange,
  onScaleChange,
  onWidthChange,
  onTransformChange,
  minScale = 0.3,
  maxScale = 5.0,
  children,
}: TransformBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleHandleMouseDown = (type: 'corner' | 'edge', handle: HandleType, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startScale = position.scale || 1.0;
    const startScaleX = position.scaleX || 1.0;
    const startScaleY = position.scaleY || 1.0;
    const startWidth = width || (containerRef.current?.offsetWidth || 200);

    const handleCornerDrag = (deltaX: number, deltaY: number) => {
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      let direction = 1;
      if (handle === 'nw') direction = (deltaX < 0 && deltaY < 0) ? 1 : -1;
      if (handle === 'ne') direction = (deltaX > 0 && deltaY < 0) ? 1 : -1;
      if (handle === 'sw') direction = (deltaX < 0 && deltaY > 0) ? 1 : -1;
      if (handle === 'se') direction = (deltaX > 0 && deltaY > 0) ? 1 : -1;

      const scaleChange = (distance * direction) / 200;

      if (mode === 'subtitle') {
        const newScale = Math.max(minScale, Math.min(maxScale, startScale + scaleChange));
        onScaleChange?.(newScale);
      } else {
        const newScale = Math.max(minScale, Math.min(maxScale, startScaleX + scaleChange));
        onTransformChange?.(newScale, newScale);
      }
    };

    const handleEdgeDrag = (deltaX: number, deltaY: number) => {
      if (mode === 'subtitle') {
        if (handle === 'left') {
          const newWidth = Math.max(100, startWidth - deltaX * 2);
          onWidthChange?.(newWidth);
        } else if (handle === 'right') {
          const newWidth = Math.max(100, startWidth + deltaX * 2);
          onWidthChange?.(newWidth);
        }
      } else {
        if (handle === 'left' || handle === 'right') {
          const scaleChange = deltaX / 100;
          const newScaleX = Math.max(minScale, Math.min(maxScale, startScaleX + scaleChange));
          onTransformChange?.(newScaleX, startScaleY);
        } else if (handle === 'top' || handle === 'bottom') {
          const scaleChange = deltaY / 100;
          const newScaleY = Math.max(minScale, Math.min(maxScale, startScaleY + scaleChange));
          onTransformChange?.(startScaleX, newScaleY);
        }
      }
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      if (type === 'corner') {
        handleCornerDrag(deltaX, deltaY);
      } else if (type === 'edge') {
        handleEdgeDrag(deltaX, deltaY);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getHandlePosition = (handle: HandleType): React.CSSProperties => {
    const offset = '-6px';
    
    switch (handle) {
      case 'nw': return { top: offset, left: offset, cursor: 'nwse-resize' };
      case 'ne': return { top: offset, right: offset, cursor: 'nesw-resize' };
      case 'sw': return { bottom: offset, left: offset, cursor: 'nesw-resize' };
      case 'se': return { bottom: offset, right: offset, cursor: 'nwse-resize' };
      case 'left': return { top: '50%', left: offset, transform: 'translateY(-50%)', cursor: 'ew-resize' };
      case 'right': return { top: '50%', right: offset, transform: 'translateY(-50%)', cursor: 'ew-resize' };
      case 'top': return { top: offset, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' };
      case 'bottom': return { bottom: offset, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' };
      default: return {};
    }
  };

  const renderHandle = (type: 'corner' | 'edge', handle: HandleType) => (
    <div
      key={handle}
      className="absolute w-3 h-3 bg-white border-2 border-accent-purple rounded-full transition-transform hover:scale-125 active:scale-150"
      style={getHandlePosition(handle)}
      onMouseDown={(e) => handleHandleMouseDown(type, handle, e)}
    />
  );

  if (!isSelected) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      {children}
      
      {renderHandle('corner', 'nw')}
      {renderHandle('corner', 'ne')}
      {renderHandle('corner', 'sw')}
      {renderHandle('corner', 'se')}
      
      {mode === 'subtitle' ? (
        <>
          {renderHandle('edge', 'left')}
          {renderHandle('edge', 'right')}
        </>
      ) : (
        <>
          {renderHandle('edge', 'left')}
          {renderHandle('edge', 'right')}
          {renderHandle('edge', 'top')}
          {renderHandle('edge', 'bottom')}
        </>
      )}
    </div>
  );
}