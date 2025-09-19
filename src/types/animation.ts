export type AnimationCategory = 'custom' | 'featured' | 'advanced' | 'basic';

export type AnimationEffectType = 'entrance' | 'continuous' | 'exit';

export interface AnimationEffect {
  type: AnimationEffectType;
  name: string;
  duration: number;
  delay?: number;
  easing?: string;
  properties: Record<string, any>;
}

export interface AnimationTemplate {
  id: string;
  name: string;
  preview: string;
  category: AnimationCategory;
  effects: AnimationEffect[];
}