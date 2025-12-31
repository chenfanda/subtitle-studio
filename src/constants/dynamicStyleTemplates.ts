import type { DynamicStyleTemplate } from '@/types/animation';
import { ANIMATION_TEMPLATES } from './animationTemplates';
import { TEXT_STYLE_TEMPLATES } from './textStyleTemplates';

// 辅助函数：安全获取样式，如果找不到则返回默认样式，防止崩溃
const getStyle = (category: string, id: string) => {
  const template = TEXT_STYLE_TEMPLATES[category]?.find(t => t.id === id);
  if (!template) {
    console.warn(`Template not found: ${category}/${id}, using fallback.`);
    // 返回一个兜底的样式，避免崩溃
    return TEXT_STYLE_TEMPLATES.basic[0].style;
  }
  return template.style;
};

// 辅助函数：安全获取动画
const getAnimation = (category: string, id: string) => {
  const template = ANIMATION_TEMPLATES[category]?.find(t => t.id === id);
  if (!template || !template.effects[0]) {
    console.warn(`Animation not found: ${category}/${id}, using fallback.`);
    // 返回一个兜底动画（假设 basic 分类下一定有 fade-in，如果没有请根据实际情况调整）
    return ANIMATION_TEMPLATES.basic[0].effects[0];
  }
  return template.effects[0];
};

const dynamicTemplate1: DynamicStyleTemplate = {
  id: 'featured-glow-headline',
  name: '描边发光',
  preview: '描边发光',
  category: 'featured',
  // 旧 ID: headline-3 -> 新 ID: basic-3
  style: getStyle('basic', 'basic-3'),
  animation: getAnimation('featured', 'glow-pulse'),
};

const dynamicTemplate2: DynamicStyleTemplate = {
  id: 'featured-bounce-subscribe',
  name: '弹跳订阅',
  preview: '弹跳订阅',
  category: 'featured',
  // 旧 ID: subscribe-red -> 新 ID: social-like (近似替代)
  style: getStyle('socialMedia', 'social-like'),
  animation: getAnimation('advanced', 'bounce-in'),
};

const dynamicTemplate3: DynamicStyleTemplate = {
  id: 'featured-rainbow-wave',
  name: '彩虹波浪',
  preview: '彩虹波浪',
  category: 'featured',
  // 旧 ID: headline-1 -> 新 ID: basic-1
  style: getStyle('basic', 'basic-1'),
  animation: getAnimation('featured', 'rainbow-wave'),
};

const dynamicTemplate4: DynamicStyleTemplate = {
  id: 'featured-typewriter-note',
  name: '打字机便签',
  preview: '打字机便签',
  category: 'featured',
  // 旧 ID: note-1 -> 新 ID: note-1 (ID 没变，但引用方式安全化)
  style: getStyle('note', 'note-1'),
  animation: getAnimation('featured', 'typewriter'),
};

const dynamicTemplate5: DynamicStyleTemplate = {
  id: 'featured-white-glow',
  name: '白色发光',
  preview: '白色发光',
  category: 'featured',
  // 旧 ID: headline-1 -> 新 ID: basic-1
  style: getStyle('basic', 'basic-1'),
  animation: getAnimation('featured', 'glow-pulse'),
};

const dynamicTemplate6: DynamicStyleTemplate = {
  id: 'featured-youtube-slide',
  name: '滑入订阅',
  preview: '滑入订阅',
  category: 'featured',
  // 旧 ID: subscribe-youtube -> 新 ID: social-yt
  style: getStyle('socialMedia', 'social-yt'),
  animation: getAnimation('basic', 'slide-up'),
};

const dynamicTemplate7: DynamicStyleTemplate = {
  id: 'featured-pink-fade',
  name: '粉色渐入',
  preview: '粉色渐入',
  category: 'featured',
  // 旧 ID: text-3 -> 新 ID: title-1 (近似替代)
  style: getStyle('title', 'title-1'),
  animation: getAnimation('basic', 'fade-in'),
};

const dynamicTemplate8: DynamicStyleTemplate = {
  id: 'featured-box-scale',
  name: '方框缩放',
  preview: '方框缩放',
  category: 'featured',
  // 旧 ID: headline-2 -> 新 ID: basic-2
  style: getStyle('basic', 'basic-2'),
  animation: getAnimation('basic', 'scale-in'),
};

const dynamicTemplate9: DynamicStyleTemplate = {
  id: 'featured-red-note-slide',
  name: '红色便签',
  preview: '红色便签',
  category: 'featured',
  // 旧 ID: note-2 -> 新 ID: note-2
  style: getStyle('note', 'note-2'),
  animation: getAnimation('basic', 'slide-up'),
};

const dynamicTemplate10: DynamicStyleTemplate = {
  id: 'featured-outline-rotate',
  name: '旋转描边',
  preview: '旋转描边',
  category: 'featured',
  // 旧 ID: subscribe-outline -> 新 ID: social-share (近似替代)
  style: getStyle('socialMedia', 'social-share'),
  animation: getAnimation('advanced', 'rotate-zoom'),
};

const dynamicTemplate11: DynamicStyleTemplate = {
  id: 'featured-blue-typewriter',
  name: '蓝色打字机',
  preview: '蓝色打字机',
  category: 'featured',
  // 旧 ID: text-2 -> 新 ID: title-2 (近似替代)
  style: getStyle('title', 'title-2'),
  animation: getAnimation('featured', 'typewriter'),
};

const dynamicTemplate12: DynamicStyleTemplate = {
  id: 'featured-italic-fade',
  name: '斜体渐入',
  preview: '斜体渐入',
  category: 'featured',
  // 旧 ID: note-3 -> 新 ID: note-3
  style: getStyle('note', 'note-3'),
  animation: getAnimation('basic', 'fade-in'),
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