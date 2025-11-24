import React from 'react';
import { convertStyleToCSS } from '@/utils/textStyleUtils';
import { createKeyframe, generateAnimationStyle } from '../utils/css-adapter';
import type { TextElement } from '@/types/textElement';
import type { RichTextSegment } from '@/types/subtitle';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';

// 🟢 1. 接口增加 scaleFactor
interface RenderTextElementProps {
  element: TextElement;
  scaleFactor?: number; 
}

export const RenderTextElement: React.FC<RenderTextElementProps> = ({ 
  element,
  scaleFactor = 1 
}) => {
  const { position } = element;
  
  // 🟢 2. 计算最终缩放
  const finalScaleX = position.scaleX * scaleFactor;
  const finalScaleY = position.scaleY * scaleFactor;
  
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${position.x}%`,
    top: `${position.y}%`,
    // 应用缩放
    transform: `
      translate(-50%, -50%) 
      scaleX(${finalScaleX}) 
      scaleY(${finalScaleY}) 
      rotate(${position.rotation}deg)
    `,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  };

  const baseStyle = (element.richText && element.richText.length > 0)
    ? (element.richText[0].style || element.style || DEFAULT_SUBTITLE_STYLE)
    : (element.style || DEFAULT_SUBTITLE_STYLE);

  const renderContent = () => {
    if (element.richText && element.richText.length > 0) {
      return element.richText.map((segment: RichTextSegment, index: number) => {
        const cssStyle = convertStyleToCSS(segment.style);
        let animationStyle: React.CSSProperties = {};
        let keyframeCss = '';

        if (segment.animation) {
          const animName = `anim_txt_${element.id.replace(/-/g, '_')}_${index}`;
          keyframeCss = createKeyframe(animName, segment.animation);
          animationStyle = generateAnimationStyle(animName, segment.animation);
        }

        return (
          <React.Fragment key={index}>
            {keyframeCss && <style>{keyframeCss}</style>}
            <span 
              style={{ ...cssStyle, ...animationStyle, display: 'inline-block' }}
            >
              {segment.text}
            </span>
          </React.Fragment>
        );
      });
    }
    return <span style={convertStyleToCSS(baseStyle)}>{element.text}</span>;
  };

  return (
    <div style={containerStyle}>
      <div className="px-4 py-2">
        {renderContent()}
      </div>
    </div>
  );
};