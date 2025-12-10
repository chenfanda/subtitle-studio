import React from 'react';
import type { WatermarkConfig } from '@/types/settings';
import { WatermarkLogo } from '@/components/common/WatermarkLogo';

interface RenderWatermarkProps {
  config: WatermarkConfig;
  scaleFactor?: number; 
}

export const RenderWatermark: React.FC<RenderWatermarkProps> = ({ 
  config,
  scaleFactor = 1 
}) => {
  if (!config.enabled) return null;

  
  let positionStyle: React.CSSProperties = {
    transform: 'translate(-50%, -50%)',
  };

  if (config.positionMode === 'custom') {
    positionStyle = {
      ...positionStyle,
      left: `${config.customPosition.x}%`,
      top: `${config.customPosition.y}%`,
    };
  } else {

    const PADDING_PCT = '5%'; 
    const FAR_PCT = '85%'; 

    switch (config.position) {
      case 'top-left': 
        positionStyle = { ...positionStyle, left: PADDING_PCT, top: PADDING_PCT }; 
        break;
      case 'top-right': 
        positionStyle = { ...positionStyle, left: FAR_PCT, top: PADDING_PCT }; 
        break;
      case 'bottom-left': 
        positionStyle = { ...positionStyle, left: PADDING_PCT, top: FAR_PCT }; 
        break;
      case 'bottom-right': 
        positionStyle = { ...positionStyle, left: FAR_PCT, top: FAR_PCT }; 
        break;
    }
  }


  const finalFontSize = config.fontSize * scaleFactor;

  const paddingX = 12 * scaleFactor;

  const paddingY = 8 * scaleFactor;
  
  const borderRadius = 8 * scaleFactor;
  
  const gap = 8 * scaleFactor;

  const iconSize = 32 * scaleFactor;

  const iconColor = config.backgroundColor.includes('rgba(0, 0, 0') ? '#ffffff' : '#000000';

  return (
    <div 
      style={{
        position: 'absolute',
        zIndex: 100,
        pointerEvents: 'none',
        // 布局
        display: 'flex',
        alignItems: 'center',
        gap: `${gap}px`,
        // 字体
        fontFamily: config.fontFamily,
        fontSize: `${finalFontSize}px`,
        color: config.color,
        // 背景与边框
        backgroundColor: config.backgroundColor,
        opacity: config.opacity / 100,
        padding: config.backgroundColor !== 'transparent' ? `${paddingY}px ${paddingX}px` : '0',
        borderRadius: `${borderRadius}px`,
        // 特效 (模拟 backdrop-blur-sm)
        backdropFilter: 'blur(4px)',
        whiteSpace: 'nowrap',
        // 位置
        ...positionStyle,
      }}
    >
      {/* 4. 添加 Logo 部分 */}
      <div 
        style={{ 
          width: `${iconSize}px`, 
          height: `${iconSize}px`,
          color: iconColor,
          flexShrink: 0, // 防止被压缩
          marginRight: `${4 * scaleFactor}px` // 额外的微调间距，对应 mr-1
        }}
      >
        <WatermarkLogo />
      </div>

      {/* 文本部分 */}
      <span style={{ fontWeight: 500, lineHeight: 1 }}>
        {config.text}
      </span>
    </div>
  );
};