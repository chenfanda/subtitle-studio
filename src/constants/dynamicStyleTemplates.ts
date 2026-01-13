import type { DynamicStyleTemplate, AnimationEffect } from '@/types/animation';
import { STATIC_STYLE_TEMPLATES } from './staticStyleTemplates';

const PREVIEW_PATH = '/assets/templates/previews';

/**
 * 🟢 修复：显式定义 props 类型为 Record<string, any>
 * 这样 TypeScript 就会允许传入 transform, filter, letterSpacing 等任何属性
 */
const createAnim = (
  name: string, 
  duration = 500, 
  props: Record<string, any> = { opacity: [0, 1] }
): AnimationEffect => ({
  type: 'entrance',
  name,
  duration,
  properties: props
});

const DYNAMIC_STYLE_TEMPLATES_LIST: DynamicStyleTemplate[] = [

  {
    id: 'dynamic-3004',
    name: '胶囊高亮',
    preview: `${PREVIEW_PATH}/3004-17328603641373004_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[1].style, fontWeight: 'bold' },
    animation: createAnim('fill'),
    karaokeConfig: {
      type: 'karaoke',
      activeStyle: { color: '#FFFFFF', backgroundColor: '#FF0054', backgroundShape: 9 },
      inactiveStyle: { color: '#FFFFFF', backgroundColor: 'transparent', backgroundShape: 0 },
      emphasisType: 'none',
      transitionDuration: 100
    }
  },

  {
    id: 'dynamic-1000',
    name: '渐显',
    preview: `${PREVIEW_PATH}/1000-17022905416861000_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('fadeIn', 600)
  },
  {
    id: 'dynamic-1001',
    name: '缩放弹出',
    preview: `${PREVIEW_PATH}/1001-17388952482331001_zeemoApp_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('scaleIn', 500, { transform: ['scale(0)', 'scale(1)'] })
  },
  {
    id: 'dynamic-1002',
    name: '底部弹出',
    preview: `${PREVIEW_PATH}/1002-17055736385931002_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('slideUp', 400, { transform: ['translateY(100%)', 'translateY(0%)'] })
  },
  {
    id: 'dynamic-1003',
    name: '左侧滑入',
    preview: `${PREVIEW_PATH}/1003-17055735358891003_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('slideLeft', 500, { transform: ['translateX(-100%)', 'translateX(0%)'] })
  },
  {
    id: 'dynamic-1004',
    name: '顶部跌落',
    preview: `${PREVIEW_PATH}/1004-17212038616291004_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('slideDown', 500, { transform: ['translateY(-100%)', 'translateY(0%)'] })
  },
  {
    id: 'dynamic-1005',
    name: '弹性缩放',
    preview: `${PREVIEW_PATH}/1005-17022912988421005_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('elasticScale', 800, { transform: ['scale(0)', 'scale(1.2)', 'scale(1)'] })
  },
  {
    id: 'dynamic-1006',
    name: '打字机',
    preview: `${PREVIEW_PATH}/1006-17055734724951006_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('typewriter', 1000, { width: ['0%', '100%'] })
  },
  {
    id: 'dynamic-1007',
    name: '模糊进入',
    preview: `${PREVIEW_PATH}/1007-17055736023701007_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('blurIn', 800, { filter: ['blur(15px)', 'blur(0px)'], opacity: [0, 1] })
  },
  {
    id: 'dynamic-1008',
    name: '翻转进入',
    preview: `${PREVIEW_PATH}/1008-17055735776791008_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('flipIn', 700, { transform: ['rotateX(90deg)', 'rotateX(0deg)'] })
  },
  {
    id: 'dynamic-1009',
    name: '旋转放大',
    preview: `${PREVIEW_PATH}/1009-17055736225551009_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('rotateScale', 600, { transform: ['rotate(-180deg) scale(0)', 'rotate(0deg) scale(1)'] })
  },
  {
    id: 'dynamic-1010',
    name: '淡入',
    preview: `${PREVIEW_PATH}/1010-17055735042471010_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('fadeIn', 500)
  },
  {
    id: 'dynamic-1011',
    name: '右侧滑入',
    preview: `${PREVIEW_PATH}/1011-17022913439021011_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('slideRight', 500, { transform: ['translateX(100%)', 'translateX(0%)'] })
  },
  {
    id: 'dynamic-1012',
    name: '模糊淡入',
    preview: `${PREVIEW_PATH}/1012-17204923635111012_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('blurFade', 800, { filter: ['blur(10px)', 'blur(0px)'], opacity: [0, 1] })
  },
  {
    id: 'dynamic-1013',
    name: '描边生长',
    preview: `${PREVIEW_PATH}/1013-17022914226261013_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[1].style, fontWeight: 'bold' },
    animation: createAnim('strokeIn', 800)
  },
  {
    id: 'dynamic-1014',
    name: '垂直翻转',
    preview: `${PREVIEW_PATH}/1014-17055736632701014_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('flipV', 600, { transform: ['rotateY(90deg)', 'rotateY(0deg)'] })
  },
  {
    id: 'dynamic-1022',
    name: '波纹进入',
    preview: `${PREVIEW_PATH}/1022-17022905754681022_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('waveIn', 800, { letterSpacing: [20, 0], opacity: [0, 1] })
  },
  {
    id: 'dynamic-1023',
    name: '果冻弹出',
    preview: `${PREVIEW_PATH}/1023-17022914450641023_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('jelly', 900, { transform: ['scale(1,1)', 'scale(1.2,0.8)', 'scale(0.8,1.2)', 'scale(1,1)'] })
  },
  {
    id: 'dynamic-1024',
    name: '螺旋进入',
    preview: `${PREVIEW_PATH}/1024-17022914547501024_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('spiral', 1000, { transform: ['rotate(360deg) scale(0)', 'rotate(0deg) scale(1)'] })
  },
  {
    id: 'dynamic-1025',
    name: '光晕进入',
    preview: `${PREVIEW_PATH}/1025-17031471023341025_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('glowIn', 700, { textShadow: ['0 0 50px #fff', '0 0 0px #fff'] })
  },
  {
    id: 'dynamic-1026',
    name: '飞入效果',
    preview: `${PREVIEW_PATH}/1026-17041933955201026_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('flyIn', 600, { transform: ['translate(100px, -100px)', 'translate(0, 0)'] })
  },
  {
    id: 'dynamic-1027',
    name: '彩虹流光',
    preview: `${PREVIEW_PATH}/1027-17218922139761027_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: {
      type: 'continuous',
      name: 'rainbow',
      duration: 3000,
      properties: { color: ['#ff0000', '#00ff00', '#0000ff', '#ff0000'] }
    }
  },
  {
    id: 'dynamic-1029',
    name: '收缩进入',
    preview: `${PREVIEW_PATH}/1029-17047098489981029_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('shrink', 500, { transform: ['scale(2)', 'scale(1)'], opacity: [0, 1] })
  },
  {
    id: 'dynamic-1030',
    name: '霓虹闪烁',
    preview: `${PREVIEW_PATH}/1030-17072724262801030_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[3].style, fontWeight: 'bold' },
    animation: {
      type: 'continuous',
      name: 'blink',
      duration: 1000,
      properties: { opacity: [1, 0.3, 1] }
    }
  },
  {
    id: 'dynamic-1031',
    name: '故障风格',
    preview: `${PREVIEW_PATH}/1031-17072081509251031_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('glitch', 400, { transform: ['skew(10deg)', 'skew(-10deg)', 'skew(0deg)'] })
  },
  {
    id: 'dynamic-1032',
    name: '向左滑入',
    preview: `${PREVIEW_PATH}/1032-17096364386181032_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('slideL', 500, { transform: ['translateX(50px)', 'translateX(0)'] })
  },
  {
    id: 'dynamic-1033',
    name: '向右滑入',
    preview: `${PREVIEW_PATH}/1033-17165224702791033.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('slideR', 500, { transform: ['translateX(-50px)', 'translateX(0)'] })
  },
  {
    id: 'dynamic-1037',
    name: '反弹弹出',
    preview: `${PREVIEW_PATH}/1037-17163681240581037_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('bounceIn', 700, { transform: ['translateY(200px)', 'translateY(0)'] })
  },
  {
    id: 'dynamic-1039',
    name: '聚焦显现',
    preview: `${PREVIEW_PATH}/1039-17434972742331039_preview_en.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('focus', 800, { filter: ['blur(20px)', 'blur(0px)'], scale: [1.5, 1] })
  },
  {
    id: 'dynamic-1040',
    name: '展开进入',
    preview: `${PREVIEW_PATH}/1040-17434972500191040_preview_en.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('expand', 600, { letterSpacing: [-10, 0], opacity: [0, 1] })
  },
  {
    id: 'dynamic-1041',
    name: '弹性缩放',
    preview: `${PREVIEW_PATH}/1041-17225605723411041_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('elastic', 700, { transform: ['scale(0)', 'scale(1.1)', 'scale(1)'] })
  },
  {
    id: 'dynamic-1043',
    name: '流光进入',
    preview: `${PREVIEW_PATH}/1043-17218919975451043_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('stream', 800, { opacity: [0, 1], transform: ['translateX(-30px)', 'translateX(0)'] })
  },
  {
    id: 'dynamic-1044',
    name: '利落上滑',
    preview: `${PREVIEW_PATH}/1044-17237278349341044_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('sharp', 400, { transform: ['translateY(30px)', 'translateY(0)'] })
  },
  {
    id: 'dynamic-1045',
    name: '纵向拉伸',
    preview: `${PREVIEW_PATH}/1045-17495422077291045_preview2.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('compress', 600, { transform: ['scaleY(0)', 'scaleY(1)'] })
  },
  {
    id: 'dynamic-1046',
    name: '对角滑入',
    preview: `${PREVIEW_PATH}/1046-17325186993001046_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('diagonal', 500, { transform: ['translate(-50px, -50px)', 'translate(0, 0)'] })
  },
  {
    id: 'dynamic-1047',
    name: '平滑滑入',
    preview: `${PREVIEW_PATH}/1047-17315585334071047_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('smoothUp', 600, { transform: ['translateY(20px)', 'translateY(0)'], opacity: [0, 1] })
  },
  {
    id: 'dynamic-1050',
    name: '方块显现',
    preview: `${PREVIEW_PATH}/1050-17328604341991050_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[1].style, fontWeight: 'bold' },
    animation: createAnim('boxPop', 500, { transform: ['scale(0.8)', 'scale(1)'], opacity: [0, 1] })
  },
  {
    id: 'dynamic-1051',
    name: '淡入放大',
    preview: `${PREVIEW_PATH}/1051-17363895781151051_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('fadeScale', 700, { transform: ['scale(0.9)', 'scale(1)'], opacity: [0, 1] })
  },
  {
    id: 'dynamic-1060',
    name: '高亮闪烁',
    preview: `${PREVIEW_PATH}/1060-17393539045841060_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'bold' },
    animation: createAnim('shine', 800, { filter: ['brightness(2)', 'brightness(1)'] })
  },
  {
    id: 'dynamic-1061',
    name: '轻微抖动',
    preview: `${PREVIEW_PATH}/1061-17397900100061061_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: {
      type: 'continuous',
      name: 'shake',
      duration: 500,
      properties: { transform: ['translateX(-2px)', 'translateX(2px)', 'translateX(0)'] }
    }
  },
  {
    id: 'dynamic-1063',
    name: '平滑淡入',
    preview: `${PREVIEW_PATH}/1063-17436443368241063_preview.webp`,
    category: 'dynamic',
    style: { ...STATIC_STYLE_TEMPLATES[0].style, fontWeight: 'normal' },
    animation: createAnim('fade', 400)
  }
];

export const DYNAMIC_STYLE_TEMPLATES: Record<string, DynamicStyleTemplate[]> = {
  featured: DYNAMIC_STYLE_TEMPLATES_LIST.filter(t => t.id.includes('300') || ['dynamic-1006', 'dynamic-1041'].includes(t.id)),
  advanced: DYNAMIC_STYLE_TEMPLATES_LIST,
  custom: []
};