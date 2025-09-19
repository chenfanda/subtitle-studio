// src/components/common/Watermark.tsx
import React, { useState, useRef } from 'react';
import type { WatermarkConfig } from '../../stores/useSettingsStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface WatermarkProps {
  config: WatermarkConfig;
}

export function Watermark({ config }: WatermarkProps) {
  const { updateWatermark, switchToCustomPosition } = useSettingsStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const watermarkRef = useRef<HTMLDivElement>(null);

  if (!config.enabled) {
    return null;
  }

  // 根据位置模式计算实际位置
  const getPosition = () => {
    if (config.positionMode === 'custom') {
      return {
        left: `${config.customPosition.x}%`,
        top: `${config.customPosition.y}%`,
      };
    } else {
      // 预设位置
      const presetPositions = {
        'top-left': { left: '5%', top: '5%' },
        'top-right': { left: '85%', top: '5%' },
        'bottom-left': { left: '5%', top: '85%' },
        'bottom-right': { left: '85%', top: '85%' },
      };
      return presetPositions[config.position];
    }
  };

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!watermarkRef.current) return;

    // 如果是预设模式，自动切换到自定义模式
    if (config.positionMode === 'preset') {
      switchToCustomPosition();
    }

    setIsDragging(true);
    
    // 计算鼠标相对于水印元素的偏移
    const rect = watermarkRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // 添加全局事件监听
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!watermarkRef.current) return;
      
      const parent = watermarkRef.current.parentElement;
      if (!parent) return;
      
      const parentRect = parent.getBoundingClientRect();
      
      // 计算新位置（百分比）
      const newX = ((moveEvent.clientX - offsetX - parentRect.left) / parentRect.width) * 100;
      const newY = ((moveEvent.clientY - offsetY - parentRect.top) / parentRect.height) * 100;
      
      // 限制在视频区域内
      const clampedX = Math.max(0, Math.min(100, newX));
      const clampedY = Math.max(0, Math.min(100, newY));
      
      // 更新水印位置
      updateWatermark({
        positionMode: 'custom',
        customPosition: { x: clampedX, y: clampedY }
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 生成内联样式
  const watermarkStyle: React.CSSProperties = {
    fontFamily: config.fontFamily,
    fontSize: `${config.fontSize}px`,
    color: config.color,
    backgroundColor: config.backgroundColor,
    opacity: config.opacity / 100,
    userSelect: 'none',
    transform: 'translate(-50%, -50%)', // 居中对齐
    ...getPosition(), // 应用计算后的位置
  };

  return (
    <div 
      ref={watermarkRef}
      className={`absolute z-10 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } pointer-events-auto`}
      style={watermarkStyle}
      onMouseDown={handleMouseDown}
      title={config.positionMode === 'preset' ? '点击拖拽切换到自定义位置' : '拖拽调整位置'}
    >
      <div className="flex items-center space-x-2 backdrop-blur-sm rounded-lg px-3 py-2">
        {/* 简单的Logo图标 */}
        <div className="w-5 h-5 bg-current rounded flex items-center justify-center opacity-90">
          <span 
            className="text-xs font-bold"
            style={{ 
              color: config.backgroundColor.includes('rgba(0, 0, 0') ? '#ffffff' : '#000000'
            }}
          >
            S
          </span>
        </div>
        
        {/* 水印文本 */}
        <span className="font-medium leading-none">
          {config.text}
        </span>
        
        {/* 模式指示器（调试用，可选） */}
        {config.positionMode === 'custom' && (
          <div className="w-2 h-2 bg-green-400 rounded-full opacity-60" 
               title="自定义位置模式" />
        )}
      </div>
    </div>
  );
}