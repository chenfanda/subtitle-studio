import type { AnimationEffect } from '@/types/animation';

export const createKeyframe = (name: string, effect: AnimationEffect): string => {
  const steps: string[] = [];
  
  Object.entries(effect.properties).forEach(([property, values]) => {
    if (Array.isArray(values)) {
      values.forEach((value, index) => {
        const percentage = (index / (values.length - 1)) * 100;
        
        if (!steps[index]) {
          steps[index] = `${percentage}% {`;
        }
        
        const cssProperty = property.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
        
        let finalValue = value;
        if (property === 'transform' && typeof value === 'number') {
          finalValue = `scale(${value})`;
        } else if (property === 'filter' && typeof value === 'number') {
          finalValue = `blur(${value}px)`;
        }
        
        steps[index] += ` ${cssProperty}: ${finalValue};`;
      });
    }
  });

  steps.forEach((step, index) => {
    steps[index] += ' }';
  });

  return `@keyframes ${name} { ${steps.join(' ')} }`;
};

export const generateAnimationStyle = (
  name: string, 
  effect: AnimationEffect
): React.CSSProperties => {
  const isContinuous = effect.type === 'continuous';
  
  const easingMap: Record<string, string> = {
    'elastic': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'stiff': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'in-out': 'cubic-bezier(0.42, 0, 0.58, 1)',
    'linear': 'linear'
  };

  const style: React.CSSProperties = {
    animationName: name,
    animationDuration: `${effect.duration}ms`,
    animationTimingFunction: easingMap[effect.easing || ''] || effect.easing || 'ease',
    animationDelay: `${effect.delay || 0}ms`,
    animationFillMode: 'both',
    animationIterationCount: isContinuous ? 'infinite' : 1,
    transformOrigin: 'center bottom',
    willChange: 'transform, opacity, filter'
  };

  if (effect.name === 'wipe') {
    style.backgroundImage = 'linear-gradient(to right, currentColor var(--wipe-progress), transparent var(--wipe-progress))';
    style.WebkitBackgroundClip = 'text';
    style.WebkitTextFillColor = 'transparent';
  }

  return style;
};

export const getEffectCSSVariables = (progress: number) => {
  return {
    '--wipe-progress': `${progress * 100}%`,
    '--dynamic-scale': 1 + Math.sin(progress * Math.PI) * 0.2,
    '--dynamic-rotate': `${Math.sin(progress * Math.PI) * 5}deg`
  } as React.CSSProperties;
};