import { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useHistoryStore } from '@/stores/useHistoryStore';

// 定义 8 个方向
type Direction = 'n' | 's' | 'w' | 'e' | 'nw' | 'ne' | 'sw' | 'se';

export function MaskOverlay() {
  const { mask, updateMask } = useSettingsStore();
  
  const [isSelected, setIsSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const [parentSize, setParentSize] = useState({ w: 0, h: 0 });
  
  const dragStartRef = useRef({
    mouseX: 0, mouseY: 0,
    maskX: 0, maskY: 0, maskW: 0, maskH: 0
  });

  useLayoutEffect(() => {
    if (!overlayRef.current) return;
    const parent = overlayRef.current.closest('.video-container') as HTMLElement;
    
    const updateSize = () => {
      if (parent && parent.offsetWidth > 0) {
        setParentSize({ w: parent.offsetWidth, h: parent.offsetHeight });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  const safeMask = useMemo(() => {
    let { x, y, width, height } = mask;
    
    if (!Number.isFinite(width) || width < 1) width = 20;
    if (!Number.isFinite(height) || height < 1) height = 10;
    if (!Number.isFinite(x)) x = 0;
    if (!Number.isFinite(y)) y = 0;

    x = Math.max(0, x);
    y = Math.max(0, y);

    if (x + width > 100) width = 100 - x;
    if (y + height > 100) height = 100 - y;

    return { x, y, width, height };
  }, [mask]);

  if (!mask.enabled) return null;

  // 拖拽逻辑
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.resize-handle, .mask-close-btn')) return;

    e.preventDefault();
    e.stopPropagation();
    
    setIsSelected(true);
    setIsDragging(true);

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      maskX: safeMask.x,
      maskY: safeMask.y,
      maskW: safeMask.width,
      maskH: safeMask.height
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleMoveEnd);
  };

  const handleMove = (e: MouseEvent) => {
    if (parentSize.w === 0) return;

    const deltaXPixel = e.clientX - dragStartRef.current.mouseX;
    const deltaYPixel = e.clientY - dragStartRef.current.mouseY;

    const deltaXPercent = (deltaXPixel / parentSize.w) * 100;
    const deltaYPercent = (deltaYPixel / parentSize.h) * 100;

    let newX = dragStartRef.current.maskX + deltaXPercent;
    let newY = dragStartRef.current.maskY + deltaYPercent;

    const maxX = 100 - dragStartRef.current.maskW;
    const maxY = 100 - dragStartRef.current.maskH;

    newX = Math.max(0, Math.min(maxX, newX));
    newY = Math.max(0, Math.min(maxY, newY));

    updateMask({ x: newX, y: newY });
  };

  const handleMoveEnd = () => {
    setIsDragging(false);
    useHistoryStore.getState().pushState();
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleMoveEnd);
  };

  // 缩放逻辑
  const startResize = (direction: Direction, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      maskX: safeMask.x,
      maskY: safeMask.y,
      maskW: safeMask.width,
      maskH: safeMask.height
    };

    const handleResize = (moveEvent: MouseEvent) => {
      if (parentSize.w === 0) return;

      const deltaXPixel = moveEvent.clientX - dragStartRef.current.mouseX;
      const deltaYPixel = moveEvent.clientY - dragStartRef.current.mouseY;

      const dx = (deltaXPixel / parentSize.w) * 100;
      const dy = (deltaYPixel / parentSize.h) * 100;

      const { maskX, maskY, maskW, maskH } = dragStartRef.current;
      
      let newX = maskX;
      let newY = maskY;
      let newW = maskW;
      let newH = maskH;

      if (direction.includes('e')) { 
        newW = Math.min(maskW + dx, 100 - maskX);
      } 
      else if (direction.includes('w')) {
        newX = maskX + dx;
        newW = maskW - dx;
        if (newX < 0) {
            newX = 0;
            newW = maskX + maskW; 
        }
      }

      if (direction.includes('s')) {
        newH = Math.min(maskH + dy, 100 - maskY);
      } 
      else if (direction.includes('n')) {
        newY = maskY + dy;
        newH = maskH - dy;
        if (newY < 0) {
            newY = 0;
            newH = maskY + maskH;
        }
      }

      if (newW < 1) {
        newW = 1;
        if (direction.includes('w')) newX = maskX + maskW - 1;
      }
      if (newH < 1) {
        newH = 1;
        if (direction.includes('n')) newY = maskY + maskH - 1;
      }

      updateMask({ x: newX, y: newY, width: newW, height: newH });
    };

    const stopResize = () => {
      useHistoryStore.getState().pushState();
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  };

  const renderHandle = (dir: Direction) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      width: '12px',
      height: '12px',
      backgroundColor: 'white',
      border: '1px solid #7c3aed',
      borderRadius: '50%',
      zIndex: 40,
      pointerEvents: 'auto',
    };
    const offset = '-6px';
    if (dir === 'nw') { style.top = offset; style.left = offset; style.cursor = 'nwse-resize'; }
    if (dir === 'ne') { style.top = offset; style.right = offset; style.cursor = 'nesw-resize'; }
    if (dir === 'sw') { style.bottom = offset; style.left = offset; style.cursor = 'nesw-resize'; }
    if (dir === 'se') { style.bottom = offset; style.right = offset; style.cursor = 'nwse-resize'; }
    if (dir === 'n') { style.top = offset; style.left = '50%'; style.transform = 'translateX(-50%)'; style.cursor = 'ns-resize'; }
    if (dir === 's') { style.bottom = offset; style.left = '50%'; style.transform = 'translateX(-50%)'; style.cursor = 'ns-resize'; }
    if (dir === 'w') { style.left = offset; style.top = '50%'; style.transform = 'translateY(-50%)'; style.cursor = 'ew-resize'; }
    if (dir === 'e') { style.right = offset; style.top = '50%'; style.transform = 'translateY(-50%)'; style.cursor = 'ew-resize'; }
    return (
      <div key={dir} className="resize-handle" style={style} onMouseDown={(e) => startResize(dir, e)} />
    );
  };

  // ----------------------------------------------------------------
  // 核心样式计算：区分高斯模糊和马赛克
  // ----------------------------------------------------------------
  const getVisualStyles = () => {
    const baseStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      borderRadius: '4px',
      border: isSelected ? '1px solid rgba(255,255,255,0.9)' : '1px dashed rgba(255,255,255,0.5)',
      boxShadow: isSelected ? '0 0 8px rgba(0,0,0,0.5)' : 'none',
    };

    if (mask.mode === 'mosaic') {
      // 马赛克模式：
      // 1. 依然使用模糊来遮挡文字内容 (强度稍微加大，防止网格缝隙漏字)
      // 2. 叠加网格背景图，模拟像素块
      // 3. backgroundSize 随强度变化，强度越大，格子越大
      const gridSize = Math.max(5, mask.intensity); 
      return {
        ...baseStyle,
        backdropFilter: `blur(${Math.max(5, mask.intensity)}px)`, 
        WebkitBackdropFilter: `blur(${Math.max(5, mask.intensity)}px)`,
        backgroundColor: 'rgba(0, 0, 0, 0.1)', // 稍微暗一点的背景
        // 使用线性渐变绘制网格
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`
      };
    } else {
      // 高斯模糊模式：
      // 纯净的模糊效果，加一点点白雾感
      return {
        ...baseStyle,
        backdropFilter: `blur(${mask.intensity}px)`,
        WebkitBackdropFilter: `blur(${mask.intensity}px)`,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      };
    }
  };

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none z-10"
      onClick={() => setIsSelected(false)}
    >
      <div
        className={`absolute pointer-events-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          left: `${safeMask.x}%`,
          top: `${safeMask.y}%`,
          width: `${safeMask.width}%`,
          height: `${safeMask.height}%`,
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          e.stopPropagation();
          setIsSelected(true);
        }}
      >
        {/* 视觉层 */}
        <div style={getVisualStyles()}>
          
          {/* 透明文字支撑，防塌缩 */}
          <div className="w-full h-full flex items-center justify-center overflow-hidden opacity-0 pointer-events-none select-none">
             <span className="text-lg font-bold">Mask Area</span>
          </div>

          {isSelected && (
            <>
              {['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].map(dir => renderHandle(dir as Direction))}
              <button 
                className="mask-close-btn absolute -top-3 -right-3 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-sm hover:bg-red-600 transition-colors z-50 cursor-pointer pointer-events-auto"
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                onClick={(e) => { e.stopPropagation(); updateMask({ enabled: false }); }}
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}