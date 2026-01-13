import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { convertStyleToCSS } from '@/utils/textStyleUtils';
import { createKeyframe, generateAnimationStyle } from '../utils/css-adapter';
import { SubtitleScene } from '@/components/video/SubtitleScene';
import type { SubtitleItem, RichTextSegment } from '@/types/subtitle';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';

interface RenderSubtitleProps {
  subtitle: SubtitleItem;
  scaleFactor?: number; 
}

export const RenderSubtitle: React.FC<RenderSubtitleProps> = ({ 
  subtitle, 
  scaleFactor = 1 
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  
  const absoluteCurrentTime = (frame / fps) + (subtitle.startTime / 1000);

  const position = subtitle.position || { x: 50, y: 85, scale: 1.0, width: undefined };
  
  const baseStyle = (subtitle.richText && subtitle.richText.length > 0)
    ? (subtitle.richText[0].style || DEFAULT_SUBTITLE_STYLE)
    : (subtitle.style || DEFAULT_SUBTITLE_STYLE);

  const finalScale = (position.scale || 1.0) * scaleFactor;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: `translate(-50%, -50%) scale(${finalScale})`,
    width: position.width ? `${position.width}px` : 'auto',
    minWidth: '330px', 
    minHeight: '50px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 
      baseStyle.verticalAlignment === 'top' ? 'flex-start' :
      baseStyle.verticalAlignment === 'bottom' ? 'flex-end' :
      'center',
    pointerEvents: 'none', 
  };

  if (subtitle.templateId) {
    return (
      <div style={containerStyle}>
        <SubtitleScene 
          subtitle={subtitle} 
          currentTime={absoluteCurrentTime} 
          scaleFactor={1} 
          isPreview={false}
        />
      </div>
    );
  }

  const contentWrapperStyle: React.CSSProperties = {
    wordBreak: 'break-word',
    textAlign: baseStyle.alignment || 'center',
    width: '100%',
  };

  const renderContent = () => {
    if (subtitle.richText && subtitle.richText.length > 0) {
      return subtitle.richText.map((segment: RichTextSegment, index: number) => {
        const cssStyle = convertStyleToCSS(segment.style);
        let animationStyle: React.CSSProperties = {};
        let keyframeCss = '';

        if (segment.animation) {
          const animName = `anim_${subtitle.id.replace(/-/g, '_')}_${index}`;
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
    return <span style={convertStyleToCSS(baseStyle)}>{subtitle.text}</span>;
  };

  return (
    <div style={containerStyle}>
      <div style={contentWrapperStyle}>
        {renderContent()}
      </div>
    </div>
  );
};