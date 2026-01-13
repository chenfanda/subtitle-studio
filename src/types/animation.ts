import type { TextStyleTemplate } from './textStyle';
import type { RichTextSegment, SubtitleStyle, SubtitleShadow } from './subtitle';

export type AnimationCategory = 'custom' | 'featured' | 'advanced' | 'basic';
export type AnimationEffectType = 'entrance' | 'continuous' | 'exit' | 'progress' | 'scene';

export interface AnimationEffect {
  type: AnimationEffectType;
  name: string;
  duration: number;
  delay?: number;
  easing?: string;
  properties: Record<string, any>;
}

export interface KaraokeEffectConfig {
  type: 'karaoke';
  activeStyle: Partial<SubtitleStyle>;
  inactiveStyle: Partial<SubtitleStyle>;
  emphasisType: 'none' | 'pop' | 'bounce' | 'glow' | 'shake' | 'brush';
  emphasisValue?: number;
  transitionDuration?: number;
}

export interface BackdropConfig {
  type: 'capsule' | 'rect' | 'bubble' | 'underline' | 'sketch';
  color: string | string[];
  opacity?: number;
  borderRadius?: string;
  padding?: string;
  animation?: 'pop' | 'slide' | 'fade' | 'none';
  shadow?: SubtitleShadow;
  zIndex?: number;
}

export interface AdvancedTextEffectConfig {
  activeColor?: string;
  inactiveColor?: string;
  rotation?: number;
  motionId?: string; 

  fillMode?: 'solid' | 'gradient' | 'wipe' | 'stagger';
  
  styleCycle?: {
    activeStyles: Partial<SubtitleStyle>[];
    inactiveStyles?: Partial<SubtitleStyle>[];
    randomize?: boolean;
  };

  entrance?: {
    type: 'fade' | 'pop' | 'slide-up' | 'blur' | 'stagger-pop';
    duration: number;
    interval?: number; 
  };

  active?: {
    style?: Partial<SubtitleStyle>;
    glow?: {
      color: string;
      blur: number;
      spread?: number;
      iteration?: 'breathing' | 'static';
    };
    physics?: {
      type: 'spring' | 'elastic' | 'smooth' | 'stiff';
      amplitude?: number;
      frequency?: number;
    };
    transform?: {
      scale?: number;
      rotate?: number;
      translateY?: number;
      skew?: number;
    };
  };

  backdrops?: BackdropConfig[];
  continuous?: {
    type: 'floating' | 'breathing' | 'swing' | 'none';
    amplitude?: number;
    speed?: number;
  };

  [key: string]: any; 
}

export type SceneLayerType = 'environment' | 'decoration' | 'text';

export interface EnvironmentConfig {
  type: 'snow' | 'stars' | 'bubbles' | 'glitch' | 'meteor' | 'sparkle' | 'none';
  renderMode: 'particle' | 'scrolling' | 'static';
  asset?: string;
  density?: number;
  speed?: number;
  opacity?: number;
  colorEffect?: string[];
  glow?: { color: string; blur: number };
  brightness?: number;
  size?: number;
  blendMode?: 'normal' | 'screen' | 'multiply' | 'overlay';
}

export interface DecorationConfig {
  id: string;
  asset: string;
  position: 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom' | 'center-top' | 'follow-active-word';
  animation: 'linear-move' | 'jumping-move' | 'sine-move' | 'arc-move' | 'swing' | 'floating' | 'breathing' | 'heart-beat' | 'shake' | 'none';
  scale: number;
  moveX?: number;
  moveY?: number;
  frequency?: number;
  amplitude?: number;
  offsetX?: number;
  offsetY?: number;
  flipX?: boolean;
  flipY?: boolean;
  opacity?: number;
  zIndex?: number;
}

export interface SceneLayer {
  type: SceneLayerType;
  config: EnvironmentConfig | DecorationConfig | AdvancedTextEffectConfig;
}

export interface AdvancedSceneTemplate {
  id: string;
  name: string;
  preview?: string;
  category: 'scene';
  baseStyleId?: string;
  layers: SceneLayer[];
}

export interface AnimationTemplate {
  id: string;
  name: string;
  preview: string;
  category: AnimationCategory;
  effects: AnimationEffect[];
}

export interface DynamicStyleTemplate {
  id: string;
  name: string;
  preview: string;
  category: string;
  style: TextStyleTemplate['style'];
  animation: AnimationEffect;
  karaokeConfig?: KaraokeEffectConfig;
}

export interface RichTextStyleTemplate {
  id: string;
  name: string;
  preview: string;
  category: string;
  segments: RichTextSegment[];
}