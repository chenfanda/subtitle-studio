import type { AnimationTemplate, AnimationEffect } from '@/types/animation';

export const generateAnimationCSS = (effects: AnimationEffect[]): string => {
  const keyframes: string[] = [];
  const animations: string[] = [];

  effects.forEach((effect, index) => {
    const keyframeName = `${effect.name}-${index}`;
    const keyframe = createKeyframe(keyframeName, effect);
    keyframes.push(keyframe);

    const animationDef = `${keyframeName} ${effect.duration}ms ${effect.easing || 'ease'} ${effect.delay || 0}ms`;
    animations.push(animationDef);
  });

  return `
    <style>
      ${keyframes.join('\n')}
      .animated-text {
        animation: ${animations.join(', ')};
      }
    </style>
  `;
};

export const applyAnimationToElement = (element: HTMLElement, effects: AnimationEffect[]): void => {
  effects.forEach((effect, index) => {
    setTimeout(() => {
      applyEffect(element, effect);
    }, effect.delay || 0);
  });
};

export const createAnimationSequence = (effects: AnimationEffect[]): string => {
  const sequence = effects.map((effect, index) => {
    const startTime = effects.slice(0, index).reduce((acc, e) => acc + (e.delay || 0), 0);
    const endTime = startTime + effect.duration;
    
    return {
      name: effect.name,
      startTime,
      endTime,
      properties: effect.properties
    };
  });

  return JSON.stringify(sequence);
};

export const getAnimationDuration = (template: AnimationTemplate): number => {
  return template.effects.reduce((total, effect) => {
    return Math.max(total, (effect.delay || 0) + effect.duration);
  }, 0);
};

export const convertToWebAnimation = (effect: AnimationEffect): Keyframe[] => {
  const keyframes: Keyframe[] = [];
  
  Object.entries(effect.properties).forEach(([property, values]) => {
    if (Array.isArray(values)) {
      values.forEach((value, index) => {
        const offset = index / (values.length - 1);
        if (!keyframes[index]) {
          keyframes[index] = { offset };
        }
        keyframes[index][property] = value;
      });
    }
  });

  return keyframes;
};

export const createEntranceEffect = (type: string, duration: number = 500): AnimationEffect => {
  const effects: Record<string, any> = {
    fadeIn: { opacity: [0, 1] },
    slideUp: { transform: ['translateY(50px)', 'translateY(0)'], opacity: [0, 1] },
    slideDown: { transform: ['translateY(-50px)', 'translateY(0)'], opacity: [0, 1] },
    slideLeft: { transform: ['translateX(50px)', 'translateX(0)'], opacity: [0, 1] },
    slideRight: { transform: ['translateX(-50px)', 'translateX(0)'], opacity: [0, 1] },
    scaleIn: { transform: ['scale(0.8)', 'scale(1)'], opacity: [0, 1] },
    rotateIn: { transform: ['rotate(180deg) scale(0.5)', 'rotate(0) scale(1)'], opacity: [0, 1] }
  };

  return {
    type: 'entrance',
    name: type,
    duration,
    properties: effects[type] || effects.fadeIn
  };
};

export const createExitEffect = (type: string, duration: number = 500): AnimationEffect => {
  const effects: Record<string, any> = {
    fadeOut: { opacity: [1, 0] },
    slideOutUp: { transform: ['translateY(0)', 'translateY(-50px)'], opacity: [1, 0] },
    slideOutDown: { transform: ['translateY(0)', 'translateY(50px)'], opacity: [1, 0] },
    slideOutLeft: { transform: ['translateX(0)', 'translateX(-50px)'], opacity: [1, 0] },
    slideOutRight: { transform: ['translateX(0)', 'translateX(50px)'], opacity: [1, 0] },
    scaleOut: { transform: ['scale(1)', 'scale(0.8)'], opacity: [1, 0] },
    rotateOut: { transform: ['rotate(0) scale(1)', 'rotate(-180deg) scale(0.5)'], opacity: [1, 0] }
  };

  return {
    type: 'exit',
    name: type,
    duration,
    properties: effects[type] || effects.fadeOut
  };
};

export const createContinuousEffect = (type: string, duration: number = 2000): AnimationEffect => {
  const effects: Record<string, any> = {
    breathe: { transform: ['scale(1)', 'scale(1.05)', 'scale(1)'] },
    pulse: { opacity: [1, 0.7, 1] },
    bounce: { transform: ['translateY(0)', 'translateY(-10px)', 'translateY(0)'] },
    shake: { transform: ['translateX(0)', 'translateX(-5px)', 'translateX(5px)', 'translateX(0)'] },
    glow: { textShadow: ['0 0 5px currentColor', '0 0 20px currentColor', '0 0 5px currentColor'] },
    rainbow: { 
      color: ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#0080ff', '#8000ff', '#ff0000'] 
    }
  };

  return {
    type: 'continuous',
    name: type,
    duration,
    properties: effects[type] || effects.breathe
  };
};

const createKeyframe = (name: string, effect: AnimationEffect): string => {
  const steps: string[] = [];
  
  Object.entries(effect.properties).forEach(([property, values]) => {
    if (Array.isArray(values)) {
      values.forEach((value, index) => {
        const percentage = (index / (values.length - 1)) * 100;
        if (!steps[index]) {
          steps[index] = `${percentage}% {`;
        }
        steps[index] += ` ${property}: ${value};`;
      });
    }
  });

  steps.forEach((step, index) => {
    steps[index] += ' }';
  });

  return `@keyframes ${name} { ${steps.join(' ')} }`;
};

const applyEffect = (element: HTMLElement, effect: AnimationEffect): void => {
  const keyframes = convertToWebAnimation(effect);
  const options: KeyframeAnimationOptions = {
    duration: effect.duration,
    easing: effect.easing || 'ease',
    fill: 'forwards'
  };

  element.animate(keyframes, options);
};