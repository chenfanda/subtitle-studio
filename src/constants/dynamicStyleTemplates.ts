import type { DynamicStyleTemplate } from '@/types/animation';
import { ANIMATION_TEMPLATES } from './animationTemplates';
import { TEXT_STYLE_TEMPLATES } from './textStyleTemplates';

const dynamicTemplate1: DynamicStyleTemplate = {
  id: 'featured-glow-headline',
  name: '描边发光',
  preview: '描边发光',
  category: 'featured',
  style: TEXT_STYLE_TEMPLATES.basic.find(t => t.id === 'headline-3')!.style,
  animation: ANIMATION_TEMPLATES.featured.find(t => t.id === 'glow-pulse')!.effects[0],
};

const dynamicTemplate2: DynamicStyleTemplate = {
  id: 'featured-bounce-subscribe',
  name: '弹跳订阅',
  preview: '弹跳订阅',
  category: 'featured',
  style: TEXT_STYLE_TEMPLATES.socialMedia.find(t => t.id === 'subscribe-red')!.style,
  animation: ANIMATION_TEMPLATES.advanced.find(t => t.id === 'bounce-in')!.effects[0],
};

const dynamicTemplate3: DynamicStyleTemplate = {
  id: 'featured-rainbow-wave',
  name: '彩虹波浪',
  preview: '彩虹波浪',
  category: 'featured',
  style: TEXT_STYLE_TEMPLATES.basic.find(t => t.id === 'headline-1')!.style,
  animation: ANIMATION_TEMPLATES.featured.find(t => t.id === 'rainbow-wave')!.effects[0],
};

const dynamicTemplate4: DynamicStyleTemplate = {
  id: 'featured-typewriter-note',
  name: '打字机便签',
  preview: '打字机便签',
  category: 'featured',
  style: TEXT_STYLE_TEMPLATES.note.find(t => t.id === 'note-1')!.style,
  animation: ANIMATION_TEMPLATES.featured.find(t => t.id === 'typewriter')!.effects[0],
};

const dynamicTemplate5: DynamicStyleTemplate = {
  id: 'featured-white-glow',
  name: '白色发光',
  preview: '白色发光',
  category: 'featured',
  style: TEXT_STYLE_TEMPLATES.basic.find(t => t.id === 'headline-1')!.style,
  animation: ANIMATION_TEMPLATES.featured.find(t => t.id === 'glow-pulse')!.effects[0],
};

const dynamicTemplate6: DynamicStyleTemplate = {
  id: 'featured-youtube-slide',
  name: '滑入订阅',
  preview: '滑入订阅',
  category: 'featured',
  style: TEXT_STYLE_TEMPLATES.socialMedia.find(t => t.id === 'subscribe-youtube')!.style,
  animation: ANIMATION_TEMPLATES.basic.find(t => t.id === 'slide-up')!.effects[0],
};

const dynamicTemplate7: DynamicStyleTemplate = {
  id: 'featured-pink-fade',
  name: '粉色渐入',
  preview: '粉色渐入',
  category: 'featured',
  style: TEXT_STYLE_TEMPLATES.title.find(t => t.id === 'text-3')!.style,
  animation: ANIMATION_TEMPLATES.basic.find(t => t.id === 'fade-in')!.effects[0],
};

const dynamicTemplate8: DynamicStyleTemplate = {
  id: 'featured-box-scale',
  name: '方框缩放',
  preview: '方框缩放',
  category: 'featured',
  style: TEXT_STYLE_TEMPLATES.basic.find(t => t.id === 'headline-2')!.style,
  animation: ANIMATION_TEMPLATES.basic.find(t => t.id === 'scale-in')!.effects[0],
};

const dynamicTemplate9: DynamicStyleTemplate = {
  id: 'featured-red-note-slide',
  name: '红色便签',
  preview: '红色便签',
  category: 'featured',
  style: TEXT_STYLE_TEMPLATES.note.find(t => t.id === 'note-2')!.style,
  animation: ANIMATION_TEMPLATES.basic.find(t => t.id === 'slide-up')!.effects[0],
};

const dynamicTemplate10: DynamicStyleTemplate = {
  id: 'featured-outline-rotate',
  name: '旋转描边',
  preview: '旋转描边',
  category: 'featured',
  style: TEXT_STYLE_TEMPLATES.socialMedia.find(t => t.id === 'subscribe-outline')!.style,
  animation: ANIMATION_TEMPLATES.advanced.find(t => t.id === 'rotate-zoom')!.effects[0],
};

const dynamicTemplate11: DynamicStyleTemplate = {
  id: 'featured-blue-typewriter',
  name: '蓝色打字机',
  preview: '蓝色打字机',
  category: 'featured',
  style: TEXT_STYLE_TEMPLATES.title.find(t => t.id === 'text-2')!.style,
  animation: ANIMATION_TEMPLATES.featured.find(t => t.id === 'typewriter')!.effects[0],
};

const dynamicTemplate12: DynamicStyleTemplate = {
  id: 'featured-italic-fade',
  name: '斜体渐入',
  preview: '斜体渐入',
  category: 'featured',
  style: TEXT_STYLE_TEMPLATES.note.find(t => t.id === 'note-3')!.style,
  animation: ANIMATION_TEMPLATES.basic.find(t => t.id === 'fade-in')!.effects[0],
};

export const DYNAMIC_STYLE_TEMPLATES: Record<string, DynamicStyleTemplate[]> = {
  featured: [
    dynamicTemplate1,
    dynamicTemplate2,
    dynamicTemplate3,
    dynamicTemplate4,
    dynamicTemplate5,
    dynamicTemplate6,
    dynamicTemplate7,
    dynamicTemplate8,
    dynamicTemplate9,
    dynamicTemplate10,
    dynamicTemplate11,
    dynamicTemplate12,
  ],
  custom: [
  ]
};