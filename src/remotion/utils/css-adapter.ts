import type { AnimationEffect } from '@/types/animation';

/**
 * 将 AnimationEffect 配置转换为 CSS @keyframes 字符串
 * 用于后端 Remotion 渲染时注入样式
 */
export const createKeyframe = (name: string, effect: AnimationEffect): string => {
  const steps: string[] = [];
  
  Object.entries(effect.properties).forEach(([property, values]) => {
    if (Array.isArray(values)) {
      values.forEach((value, index) => {
        // 计算当前关键帧的百分比位置 (0% - 100%)
        const percentage = (index / (values.length - 1)) * 100;
        
        if (!steps[index]) {
          steps[index] = `${percentage}% {`;
        }
        // 将属性名转换为 CSS 格式 (如 textShadow -> text-shadow)
        const cssProperty = property.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
        steps[index] += ` ${cssProperty}: ${value};`;
      });
    }
  });

  // 闭合每个关键帧的大括号
  steps.forEach((step, index) => {
    steps[index] += ' }';
  });

  return `@keyframes ${name} { ${steps.join(' ')} }`;
};

/**
 * 生成用于注入的 CSS 样式对象
 */
export const generateAnimationStyle = (
  name: string, 
  effect: AnimationEffect
): React.CSSProperties => {
  return {
    animationName: name,
    animationDuration: `${effect.duration}ms`,
    animationTimingFunction: effect.easing || 'ease',
    animationDelay: `${effect.delay || 0}ms`,
    animationFillMode: 'both', // 保持动画结束状态
    animationIterationCount: effect.type === 'continuous' ? 'infinite' : 1,
  };
};