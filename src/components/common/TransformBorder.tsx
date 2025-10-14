import { useRef } from 'react';

interface TransformBorderProps {
  isSelected: boolean;
  position: { x: number; y: number };
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  width?: number;  // ✅ 新增：字幕容器宽度
  mode: 'subtitle' | 'media';
  onPositionChange?: (x: number, y: number) => void;
  onScaleChange?: (scale: number) => void;
  onWidthChange?: (width: number) => void;  // ✅ 新增：宽度变化回调
  onTransformChange?: (scaleX: number, scaleY: number) => void;
  minScale?: number;
  maxScale?: number;
  children: React.ReactNode;
}

type HandleType = 'nw' | 'ne' | 'sw' | 'se' | 'left' | 'right' | 'top' | 'bottom';

export function TransformBorder({
  isSelected,
  position,
  scale = 1.0,
  scaleX = 1.0,
  scaleY = 1.0,
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

    // 捕获当前值作为常量
    const startX = e.clientX;
    const startY = e.clientY;
    const startScale = scale;
    const startScaleX = scaleX;
    const startScaleY = scaleY;
    const startWidth = width || (containerRef.current?.offsetWidth || 200);  // ✅ 获取当前宽度

    // 角控制点拖拽处理
    const handleCornerDrag = (deltaX: number, deltaY: number) => {
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // 确定放大还是缩小
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

    // 边控制点拖拽处理
    const handleEdgeDrag = (deltaX: number, deltaY: number) => {
      if (mode === 'subtitle') {
        // ✅ 字幕模式：边控制点改变容器宽度
        if (handle === 'left') {
          const newWidth = Math.max(100, startWidth - deltaX * 2);  // 左边往左拉 = 变宽
          onWidthChange?.(newWidth);
        } else if (handle === 'right') {
          const newWidth = Math.max(100, startWidth + deltaX * 2);  // 右边往右拉 = 变宽
          onWidthChange?.(newWidth);
        }
      } else {
        // 媒体模式：边控制点缩放
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

    // 鼠标移动处理
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      if (type === 'corner') {
        handleCornerDrag(deltaX, deltaY);
      } else if (type === 'edge') {
        handleEdgeDrag(deltaX, deltaY);
      }
    };

    // 鼠标释放处理
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    // 绑定事件
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
      
      {/* 4个角控制点 */}
      {renderHandle('corner', 'nw')}
      {renderHandle('corner', 'ne')}
      {renderHandle('corner', 'sw')}
      {renderHandle('corner', 'se')}
      
      {/* 边控制点 */}
      {mode === 'subtitle' ? (
        <>
          {/* 字幕：只有左右两个边 */}
          {renderHandle('edge', 'left')}
          {renderHandle('edge', 'right')}
        </>
      ) : (
        <>
          {/* 媒体：4个边 */}
          {renderHandle('edge', 'left')}
          {renderHandle('edge', 'right')}
          {renderHandle('edge', 'top')}
          {renderHandle('edge', 'bottom')}
        </>
      )}
    </div>
  );
}