import { 
  AnimationEffect, 
  AdvancedSceneTemplate,
  AdvancedTextEffectConfig,
  DecorationConfig
} from '@/types/animation';
import { SubtitleStyle, DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';
import { STATIC_STYLE_TEMPLATES } from '@/constants/staticStyleTemplates';
import { DYNAMIC_STYLE_TEMPLATES } from '@/constants/dynamicStyleTemplates';
import { ADVANCED_SCENE_TEMPLATES } from '@/constants/advancedTemplates';


export const calculatePathTransform = (progress: number, config: any) => {
  const { 
    animation, 
    moveX = 0, 
    moveY = 0, 
    amplitude = 1, 
    frequency = 1, 
    flipX = false,
    isActive = false 
  } = config;
  
  const flip = flipX ? -1 : 1;
  let tx = 0, ty = 0, r = 0, s = config.scale || 1;

  switch (animation) {
    case 'snow':
    case 'bubbles':
      ty = progress * (moveY || 800);
      tx = Math.sin(progress * Math.PI * 4 * frequency) * (amplitude * 20);
      r = progress * 360; 
      break;
    case 'meteor': 
      tx = interpolateValue(progress, [0, 1], [200, -200]);
      ty = interpolateValue(progress, [0, 1], [-200, 200]);
      r = -45;
      break;
    case 'floating': 
      ty = Math.sin(progress * Math.PI * 4 * frequency) * (amplitude * 15);
      break;
      
    case 'breathing': 
      s *= (1 + Math.sin(progress * Math.PI * 2 * frequency) * (amplitude * 0.05));
      break;

    case 'swing': 
      r = Math.sin(progress * Math.PI * 2 * frequency) * (amplitude * 12);
      break;

    case 'meteor': 
      tx = interpolateValue(progress, [0, 1], [200, -200]);
      ty = interpolateValue(progress, [0, 1], [-200, 200]);
      r = -45;
      break;

    case 'arc-move': 
      tx = progress * moveX;
      ty = (progress * moveY) - Math.sin(progress * Math.PI) * (amplitude * 100);
      break;

    case 'pop-elastic': 
    case 'elastic-pop':
      if (isActive) {
        const localSpring = Math.sin(progress * Math.PI * 10) * 0.2;
        s *= (1 + localSpring);
      }
      break;

    default:
      tx = progress * moveX;
      ty = progress * moveY;
  }

  return `translate(${tx}px, ${ty}px) rotate(${r}deg) scale(${s * flip}, ${s})`;
};


export const resolveSceneConfig = (templateId: string): AdvancedSceneTemplate | null => {
  const template = ADVANCED_SCENE_TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;

  const resolvedLayers = template.layers.map(layer => {
    if (layer.type === 'text') {
      const config = layer.config as AdvancedTextEffectConfig;
      let resolvedMotion = {};
      
      if (config.motionId) {
        
        const motionPart = DYNAMIC_STYLE_TEMPLATES.advanced.find(t => t.id === config.motionId)
                        || DYNAMIC_STYLE_TEMPLATES.featured.find(t => t.id === config.motionId);
        if (motionPart) {
          resolvedMotion = motionPart.karaokeConfig || {};
        }
      }

      return {
        ...layer,
        config: {
          ...resolvedMotion,
          ...config
        }
      };
    }
    return layer;
  });

  let baseStyle = { ...DEFAULT_SUBTITLE_STYLE };
  if (template.baseStyleId) {
    const staticPart = STATIC_STYLE_TEMPLATES.find(t => t.id === template.baseStyleId);
    if (staticPart) {
      baseStyle = { ...DEFAULT_SUBTITLE_STYLE, ...(staticPart.style as any) };
    }
  }

  return {
    ...template,
    layers: resolvedLayers,
    baseStyleFallback: baseStyle
  } as any;
};


export const deepMergeStyle = (base: SubtitleStyle, override: Partial<SubtitleStyle>): SubtitleStyle => {
  const result = { ...base };
  Object.entries(override).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      (result as any)[key] = { ...(result as any)[key], ...value };
    } else {
      (result as any)[key] = value;
    }
  });
  return result;
};


export const getSpringValue = (frame: number, stiffness = 180, damping = 12, mass = 1) => {
  const fps = 60;
  const t = frame / fps;
  if (t <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
};


export const interpolateValue = (value: number, input: [number, number], output: [number, number]) => {
  const [inMin, inMax] = input;
  const [outMin, outMax] = output;
  const clamped = Math.max(inMin, Math.min(inMax, value));
  return outMin + (clamped - inMin) * (outMax - outMin) / (inMax - inMin);
};


export const convertToWebAnimation = (effect: AnimationEffect): Keyframe[] => {
  const keyframes: Keyframe[] = [];
  Object.entries(effect.properties).forEach(([property, values]) => {
    if (Array.isArray(values)) {
      values.forEach((value, index) => {
        const offset = index / (values.length - 1);
        if (!keyframes[index]) keyframes[index] = { offset };
        keyframes[index][property] = value;
      });
    }
  });
  return keyframes;
};


export const createKeyframe = (name: string, effect: AnimationEffect): string => {
  const steps: string[] = [];
  Object.entries(effect.properties).forEach(([property, values]) => {
    if (Array.isArray(values)) {
      values.forEach((value, index) => {
        const percentage = (index / (values.length - 1)) * 100;
        if (!steps[index]) steps[index] = `${percentage}% {`;
        const cssProperty = property.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
        steps[index] += ` ${cssProperty}: ${value};`;
      });
    }
  });
  steps.forEach((step, index) => steps[index] += ' }');
  return `@keyframes ${name} { ${steps.join(' ')} }`;
};


export const generateAnimationCSS = (effects: AnimationEffect[]): string => {
  const keyframes: string[] = [];
  const animations: string[] = [];
  effects.forEach((effect, index) => {
    const keyframeName = `${effect.name}-${index}`;
    keyframes.push(createKeyframe(keyframeName, effect));
    animations.push(`${keyframeName} ${effect.duration}ms ${effect.easing || 'ease'} ${effect.delay || 0}ms`);
  });
  return `<style>${keyframes.join('\n')}.animated-text { animation: ${animations.join(', ')}; }</style>`;
};