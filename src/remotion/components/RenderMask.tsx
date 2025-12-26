import React, { useMemo } from 'react';
import type { MaskConfig } from '@/types/settings';

interface RenderMaskProps {
  config: MaskConfig;
  scaleFactor?: number;
  // 移除 videoUrl 等参数，因为不需要再加载视频了，这样速度最快
}

export const RenderMask: React.FC<RenderMaskProps> = ({ 
  config,
  scaleFactor = 1 
}) => {
  if (!config.enabled) return null;

  const safeMask = useMemo(() => {
    let { x, y, width, height } = config;
    return { 
      x: Math.max(0, x || 0), 
      y: Math.max(0, y || 0), 
      width: width || 20, 
      height: height || 10 
    };
  }, [config]);

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${safeMask.x}%`,
    top: `${safeMask.y}%`,
    width: `${safeMask.width}%`,
    height: `${safeMask.height}%`,
    zIndex: 20, 
    pointerEvents: 'none',
    borderRadius: `${4 * scaleFactor}px`,
    overflow: 'hidden',
  };

  if (config.mode === 'mosaic') {
    // === 马赛克模拟方案 ===
    // 原理：不处理视频像素，而是盖一层半透明的“网格纹理”
    // 强度越高，网格越密集，颜色越深
    const intensity = config.intensity || 10;
    const gridSize = Math.max(4, 25 - (intensity / 4)) * scaleFactor;
    
    return (
      <div style={{
        ...baseStyle,
        // 底色：深色半透明，先压暗字幕
        backgroundColor: 'rgba(0, 0, 0, 0.3)', 
        // 纹理：绘制方格网，模拟像素块视觉
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.15) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.15) 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        // 辅助：轻微模糊，让网格和底部文字融合
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }} />
    );
  } else {
    // === 高斯模糊模拟方案 ===
    // 原理：使用背景模糊。如果环境不支持，回退到“毛玻璃”色块
    const blurAmount = (config.intensity * 1.5) * scaleFactor;
    
    return (
      <div style={{
        ...baseStyle,
        // 核心：背景模糊
        backdropFilter: `blur(${blurAmount}px)`,
        WebkitBackdropFilter: `blur(${blurAmount}px)`,
        
        // 保底：如果 Remotion 渲染时 backdrop-filter 失效，
        // 这层半透明乳白色依然能挡住字幕 (关键！)
        backgroundColor: 'rgba(255, 255, 255, 0.6)', 
        
        // 装饰：内阴影让边缘更自然
        boxShadow: `inset 0 0 ${10 * scaleFactor}px rgba(255,255,255,0.4)`
      }} />
    );
  }
};