import React from 'react';
import { OffthreadVideo, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import type { BrollVideoData } from '@/types/broll';
import type { SubtitleItem } from '@/types/subtitle';

interface RenderBrollProps {
  brollData: BrollVideoData;
  subtitle: SubtitleItem;
  volume?: number; // 全局音量因子 (0-1)
}

export const RenderBroll: React.FC<RenderBrollProps> = ({ 
  brollData, 
  subtitle,
  volume = 1 
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 计算总时长 (帧)
  const durationInSeconds = (subtitle.endTime - subtitle.startTime) / 1000;
  const durationInFrames = durationInSeconds * fps;

  // 计算当前进度 (0.0 - 1.0)
  // 输入范围: [0, durationInFrames]
  // 输出范围: [0, 1]
  // extrapolate: 'clamp' 确保进度不会超过 0 或 1
  const progress = interpolate(
    frame,
    [0, durationInFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // 计算过渡样式 (复刻前端逻辑)
  const getTransitionStyle = (): React.CSSProperties => {
    // 1. Fade 淡入淡出
    if (brollData.transition === 'fade') {
      let opacity = 1;
      
      // 前 10% 淡入
      if (progress < 0.1) {
        opacity = interpolate(progress, [0, 0.1], [0, 1]);
      } 
      // 后 10% 淡出
      else if (progress > 0.9) {
        opacity = interpolate(progress, [0.9, 1], [1, 0]);
      }
      
      return { opacity };
    }

    // 2. Glow 光晕效果 (这就是前端能做而后端FFmpeg做不好的)
    if (brollData.transition === 'glow') {
      let glowIntensity = 0;

      if (progress < 0.1) {
        glowIntensity = interpolate(progress, [0, 0.1], [0, 1]);
      } else if (progress > 0.9) {
        glowIntensity = interpolate(progress, [0.9, 1], [1, 0]);
      }

      if (glowIntensity > 0) {
        return {
          filter: `brightness(${1 + glowIntensity * 0.3})`,
          // 这里的 30px 模糊半径在 Chrome 内核下渲染效果极佳
          boxShadow: `0 0 ${30 * glowIntensity}px rgba(255, 255, 255, ${0.5 * glowIntensity})`,
          // 保证层级在最上，防止被其他元素遮挡光晕
          zIndex: 10, 
        };
      }
    }

    return {};
  };

  // 基础样式：撑满容器 + 保持比例裁剪
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover', // 关键属性
    ...getTransitionStyle(),
  };

  // 计算最终音量
  // brollData.volume 是 0-100，需要转为 0-1
  const finalVolume = (brollData.volume / 100) * volume;

  return (
    <OffthreadVideo
      src={brollData.video.url}
      style={baseStyle}
      // startFrom: 支持 B-roll 的 startOffset (剪辑起始点)
      // 将秒转换为帧 (frame = seconds * fps)
      startFrom={Math.round((brollData.startOffset || 0) * fps)}
      volume={finalVolume}
      // 禁用默认的静音，让 Remotion 处理音频
      muted={false} 
    />
  );
};