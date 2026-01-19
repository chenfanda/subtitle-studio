import React, { useMemo } from 'react';
import { staticFile } from 'remotion';
import { 
  resolveSceneConfig, 
  deepMergeStyle, 
  getSpringValue, 
  interpolateValue,
  calculatePathTransform 
} from '@/utils/animationUtils';
import { getKaraokeTimings, getActiveWordIndex } from '@/utils/karaokeUtils';
import { convertStyleToCSS } from '@/utils/textStyleUtils';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';

interface SubtitleSceneProps {
  subtitle: any;
  currentTime: number;
  scaleFactor?: number;
  isPreview?: boolean; 
}

const EnvironmentLayer = ({ config, currentTime }: any) => {
  if (!config.asset || config.type === 'none') return null;

  const { renderMode, density = 12, speed = 1, opacity = 0.6, brightness = 1 } = config;

  if (renderMode === 'static') {
    return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <img src={staticFile(config.asset)} style={{
          width: '100%', height: '100%', objectFit: 'cover',
          opacity, filter: `brightness(${brightness})`
        }} />
      </div>
    );
  }

  if (renderMode === 'scrolling') {
    const duration = 10 / speed;
    const progress = (currentTime % duration) / duration;
    const offset = progress * 100;

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[0, 1].map((i) => (
          <img key={i} src={staticFile(config.asset)} style={{
            position: 'absolute', width: '100%', height: '100%', objectFit: 'cover',
            left: 0,
            top: `${offset - i * 100}%`,
            opacity, filter: `brightness(${brightness})`
          }} />
        ))}
      </div>
    );
  }

  const duration = 6 / speed;
  return (
    <div style={{ position: 'absolute', inset: -150, overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: density }).map((_, i) => {
        const seed = i * 157.456;
        const individualProgress = ((currentTime + (seed % duration)) % duration) / duration;
        
        const transform = calculatePathTransform(individualProgress, {
          ...config,
          animation: config.type,
          moveY: 800, 
          moveX: config.type === 'meteor' ? -400 : 0
        });

        return (
          <img key={i} src={staticFile(config.asset)} style={{
            position: 'absolute',
            left: `${(seed % 1) * 100}%`,
            top: '-60px',
            width: config.size || '30px',
            opacity,
            transform,
            filter: `brightness(${brightness}) ${config.glow ? `drop-shadow(0 0 ${config.glow.blur}px ${config.glow.color})` : ''}`,
          }} />
        );
      })}
    </div>
  );
};

const DecorationLayer = ({ config, isActive, currentTime, relTimeMs, subtitle, scaleFactor = 1 }: any) => {
  const duration = subtitle.endTime - subtitle.startTime;
  const progress = Math.max(0, Math.min(1, relTimeMs / duration));
  const transform = calculatePathTransform(progress, { ...config, isActive });
  const ox = (config.offsetX || 0);
  const oy = (config.offsetY || 0);

  return <img src={staticFile(config.asset)} style={{
    position: 'absolute',
    width: 'auto',
    maxWidth: `${180 * scaleFactor}px`, 
    left: config.position.includes('left') ? ox : (config.position.includes('center') ? '50%' : 'auto'),
    right: config.position.includes('right') ? ox : 'auto',
    top: config.position.includes('top') ? oy : 'auto',
    bottom: config.position.includes('bottom') ? oy : 'auto',
    transform: `${config.position.includes('center') ? 'translateX(-50%)' : ''} ${transform}`,
    transformOrigin: 'center bottom',
    opacity: config.opacity ?? 1,
    zIndex: config.zIndex || 5,
  }} />;
};

const TextLayer = ({ templateConfig, dynamicConfig, words, activeIndex, relTimeMs, baseStyle, richText }: any) => {
  const karaoke = templateConfig?.karaokeConfig || dynamicConfig;
  const isKaraokeMode = karaoke?.type === 'karaoke';
  const physics = templateConfig?.physics || { stiffness: 220, damping: 15 };

  const backdrops = useMemo(() => {
    if (templateConfig?.backdrops) return templateConfig.backdrops;
    if (templateConfig?.background) return [templateConfig.background];
    
    if (karaoke?.activeStyle?.backgroundColor && karaoke?.activeStyle?.backgroundColor !== 'transparent') {
      return [{
        color: karaoke.activeStyle.backgroundColor,
        borderRadius: karaoke.activeStyle.backgroundShape === 9 ? '20px' : '4px',
        padding: '4px 12px',
        animation: 'pop'
      }];
    }
    return [];
  }, [templateConfig, karaoke]);


  const { 
    backgroundColor, 
    background,
    boxShadow, 
    borderRadius, 
    border,
    borderColor,
    borderWidth,
    borderStyle,
    padding,
    alignment,
    verticalAlignment,
    ...textBaseStyle 
  } = baseStyle;

  // 判断是否有容器样式
  const hasContainerStyle = !!(backgroundColor || background || boxShadow || border || (borderWidth && parseInt(borderWidth) > 0));

  // ... getStyleAtPosition 逻辑保持不变 ...
  const getStyleAtPosition = (absolutePos: number) => {
    if (!richText || richText.length === 0) return {};
    let currentLen = 0;
    for (const segment of richText) {
      if (absolutePos >= currentLen && absolutePos < currentLen + segment.text.length) {
        return segment.style || {};
      }
      currentLen += segment.text.length;
    }
    return {};
  };

  let globalCharIdx = 0;

  // 映射对齐方式
  const justifyContentMap: Record<string, string> = {
    left: 'flex-start',
    right: 'flex-end',
    center: 'center'
  };

  // 垂直对齐映射
  const alignItemsMap: Record<string, string> = {
    top: 'flex-start',
    bottom: 'flex-end',
    center: 'center'
  };

  return (
    <div style={{ 
      display: 'flex', 
      width: '100%', 
      position: 'relative', 
      zIndex: 10,
      justifyContent: justifyContentMap[alignment] || 'center',
      alignItems: alignItemsMap[verticalAlignment] || 'center',
      height: '100%', 
      pointerEvents: 'none'
    }}>
      {/* 2. 新增 Wrapper：承载块级样式 */}
      {/* 这样即使用户没有选高级模板，背景也是完整的；如果选了高级模板，这个背景作为底板存在 */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        // 内部文字对齐
        justifyContent: justifyContentMap[alignment] || 'center',
        
        // 应用提取出的块级样式
        backgroundColor,
        background,
        boxShadow,
        borderRadius,
        border,
        borderColor,
        borderWidth,
        borderStyle,
        padding, // padding 应用在 Wrapper 上，文字就不会贴边

        // 宽度策略：如果有背景，适应内容宽度；否则占满（除非左/右对齐）
        width: hasContainerStyle ? 'fit-content' : '100%',
        maxWidth: '100%',
        pointerEvents: 'auto'
      }}>
        {words.map((word: any, wordIdx: number) => {
          const isActive = isKaraokeMode && wordIdx === activeIndex;
          return (
            <span key={wordIdx} style={{ display: 'inline-flex', position: 'relative', margin: '0 0.05em' }}>
    
              {isActive && backdrops.map((bg: any, bIdx: number) => (
                <div key={bIdx} style={{
                  position: 'absolute',
                  inset: `-${bg.padding?.split(' ')?.[0] || '4px'} -${bg.padding?.split(' ')?.[1] || '12px'}`,
                  backgroundColor: bg.color, borderRadius: bg.borderRadius || '4px', zIndex: -1,
                  animation: 'capsule-pop 0.3s ease-out'
                }} />
              ))}

              {word.characters.map((charObj: any, charIdx: number) => {
                const charRelTime = relTimeMs - charObj.startTime;
                const charFrame = Math.max(0, (charRelTime / 1000) * 60);
                const springVal = getSpringValue(charFrame, physics.stiffness, physics.damping);

                const currentAbsolutePos = globalCharIdx;
                globalCharIdx++;
                const wordRichStyle = getStyleAtPosition(currentAbsolutePos);
                
     
                const activeStyle = templateConfig?.active?.style || karaoke?.activeStyle || {};
                const inactiveStyle = { color: templateConfig?.inactiveColor || karaoke?.inactiveStyle?.color || 'inherit' };

         
                const finalStyle = isKaraokeMode 
                  ? (isActive 
                      ? deepMergeStyle(deepMergeStyle(textBaseStyle, wordRichStyle), activeStyle)
                      : deepMergeStyle(deepMergeStyle(textBaseStyle, wordRichStyle), inactiveStyle))
                  : deepMergeStyle(textBaseStyle, wordRichStyle);

                const s = isActive ? interpolateValue(springVal, [0, 1], [0.8, templateConfig?.active?.transform?.scale || karaoke?.emphasisValue || 1.15]) : 1;
                const ty = isActive && karaoke?.emphasisType === 'bounce' ? interpolateValue(springVal, [0, 1], [10, 0]) : 0;

                return (
                  <span key={charIdx} style={{
                    ...convertStyleToCSS(finalStyle),
                    display: 'inline-block', whiteSpace: 'pre',
                    pointerEvents: 'none',
                    transform: isKaraokeMode ? `translateY(${ty}px) scale(${s})` : 'none',
                    transformOrigin: 'center bottom',
              
                    zIndex: 1 
                  }}>{charObj.char}</span>
                );
              })}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const SubtitleScene: React.FC<SubtitleSceneProps> = ({ subtitle, currentTime, scaleFactor = 1, isPreview = false }) => {
  const resolvedTemplate = useMemo(() => 
    subtitle.templateId ? resolveSceneConfig(subtitle.templateId) : null, 
    [subtitle.templateId]
  ) as any;

  const durationMs = subtitle.endTime - subtitle.startTime;
  const relTimeMs = (currentTime * 1000) - subtitle.startTime;
  const karaokeWords = useMemo(() => getKaraokeTimings(subtitle.text, durationMs), [subtitle.text, durationMs, subtitle.id]);
  const activeIndex = getActiveWordIndex(karaokeWords, relTimeMs);
  
  const baseStyle = useMemo(() => 
    resolvedTemplate?.baseStyleFallback || subtitle.style || DEFAULT_SUBTITLE_STYLE, 
    [resolvedTemplate, subtitle.style]
  );

  return (
    <div className="subtitle-scene-root" style={{
      position: 'relative', width: '100%', height: '100%', 
      display: 'flex', 
      flexDirection: 'column', // 确保垂直方向布局正确
      minWidth: isPreview ? '400px' : 'auto', 
      minHeight: isPreview ? '120px' : 'auto',
      transform: isPreview ? `scale(${scaleFactor})` : 'none', 
      pointerEvents: 'none'
    }}>
      {resolvedTemplate?.layers.map((layer: any, i: number) => {
        if (layer.type === 'environment') return <EnvironmentLayer key={i} config={layer.config} currentTime={currentTime} />;
        if (layer.type === 'decoration') return <DecorationLayer key={i} config={layer.config} isActive={activeIndex !== -1} currentTime={currentTime} relTimeMs={relTimeMs} subtitle={subtitle} scaleFactor={scaleFactor} />;
        return null;
      })}

      <TextLayer 
        templateConfig={resolvedTemplate?.layers.find((l: any) => l.type === 'text')?.config}
        dynamicConfig={subtitle.dynamicConfig}
        words={karaokeWords}
        activeIndex={activeIndex}
        relTimeMs={relTimeMs}
        baseStyle={baseStyle}
        richText={subtitle.richText}
      />
    </div>
  );
};