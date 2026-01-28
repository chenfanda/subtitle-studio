import type { TextStyleTemplate } from '@/types/textStyle';

const PREVIEW_PATH = '/assets/templates/previews';

export const STATIC_STYLE_TEMPLATES: TextStyleTemplate[] = [

  {
    id: '1001',
    name: '纯净白',
    preview: PREVIEW_PATH + '/basic-white.png',
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#FFFFFF',
      shadow: { offsetX: 0, offsetY: 1, blur: 2, color: 'rgba(0,0,0,0.5)' },
      stroke: { color: '#000000', width: 0 },
      backgroundColor: 'transparent',
      textAlign: 'center'
    }
  },
  {
    id: '1002',
    name: '黑色标签',
    preview: PREVIEW_PATH + '/black-label.png',
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#FFFFFF',
      backgroundColor: '#000000',
      borderRadius: 4,
      padding: '2px 8px',
      shadow: { offsetX: 0, offsetY: 0, blur: 0, color: 'transparent' },
      stroke: { color: '#000000', width: 0 },
      textAlign: 'center'
    }
  },
  {
    id: '1003',
    name: '白色标签',
    preview: PREVIEW_PATH + '/white-label.png',
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#000000',
      backgroundColor: '#FFFFFF',
      borderRadius: 4,
      padding: '2px 8px',
      shadow: { offsetX: 0, offsetY: 0, blur: 0, color: 'transparent' },
      stroke: { color: '#000000', width: 0 },
      textAlign: 'center'
    }
  },

  {
    id: '1004',
    name: '黄色标签',
    preview: PREVIEW_PATH + '/yellow-label.png',
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#000000',
      backgroundColor: '#FFD700',
      borderRadius: 4,
      padding: '2px 8px',
      shadow: { offsetX: 0, offsetY: 0, blur: 0, color: 'transparent' },
      stroke: { color: '#000000', width: 0 },
      textAlign: 'center'
    }
  },
  {
    id: '1005',
    name: '简约描边',
    preview: PREVIEW_PATH + '/simple-stroke.png',
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#FFFFFF',
      shadow: { offsetX: 1, offsetY: 1, blur: 0, color: '#000000' }, // Hard Shadow
      stroke: { color: '#000000', width: 0 },
      backgroundColor: 'transparent',
      textAlign: 'center'
    }
  },
  {
    id: '1006',
    name: '黄色描边',
    preview: PREVIEW_PATH + '/yellow-stroke.png',
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#FFD700',
      shadow: { offsetX: 1, offsetY: 1, blur: 0, color: '#000000' }, // Hard Shadow
      stroke: { color: '#000000', width: 0.60 },
      backgroundColor: 'transparent',
      textAlign: 'center'
    }
  },

  {
    id: '1007',
    name: '强力轮廓',
    preview: PREVIEW_PATH + '/strong-outline.png',
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#1ac740ff',
      shadow: { offsetX: 2, offsetY: 2, blur: 0, color: '#000000' }, // Stronger Hard Shadow
      stroke: { color: '#000000', width: 0.50 },
      backgroundColor: 'transparent',
      textAlign: 'center'
    }
  },
  {
    id: '1008',
    name: '粉色轮廓',
    preview: PREVIEW_PATH + '/pink-outline.png',
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#FF69B4',
      shadow: { offsetX: 0, offsetY: 0, blur: 2, color: '#000000' }, // Soft Black Glow (Outer Stroke)
      stroke: { color: '#000000', width: 0 },
      backgroundColor: 'transparent',
      textAlign: 'center'
    }
  },
  {
    id: '1009',
    name: '绿色轮廓',
    preview: PREVIEW_PATH + '/green-outline.png',
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#00FF00',
      shadow: { offsetX: 0, offsetY: 0, blur: 2, color: '#000000' }, // Soft Black Glow
      stroke: { color: '#000000', width: 0 },
      backgroundColor: 'transparent',
      textAlign: 'center'
    }
  },

  {
    id: '1010',
    name: '红色浮雕',
    preview: PREVIEW_PATH + '/red-emboss.png',
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#FF0000',
      stroke: { color: '#8B0000', width: 0.5 },
      shadow: { offsetX: 1, offsetY: 1, blur: 0, color: 'rgba(0,0,0,0.5)' },
      backgroundColor: 'transparent',
      textAlign: 'center'
    }
  },
  {
    id: '1011',
    name: '柔和光晕',
    preview: PREVIEW_PATH + '/soft-glow.png',
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#FFC0CB',
      stroke: { color: '#FFFFFF', width: 0 },
      shadow: { offsetX: 0, offsetY: 0, blur: 0, color: 'transparent' },
      highlightColor: '#FF69B4',
      highlightIntensity: 8,
      backgroundColor: 'transparent',
      textAlign: 'center'
    }
  },
  {
    id: '1012',
    name: '金色轮廓',
    preview: PREVIEW_PATH + '/gold-outline.png',
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#dbd5d5ff',
      stroke: { color: '#FFD700', width: 0.65 },
      shadow: { offsetX: 0, offsetY: 0, blur: 0, color: '#FFD700' }, // Gold Glow
      backgroundColor: 'transparent',
      textAlign: 'center'
    }
  },

  {
    id: '1013',
    name: '霓虹粉',
    preview: PREVIEW_PATH + '/neon-pink.png',
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#FFFFFF',
      stroke: { color: '#FF1493', width: 0.4 },
      shadow: { offsetX: 0, offsetY: 0, blur: 0.4, color: '#FF1493' },
      highlightColor: '#FF1493',
      highlightIntensity: 15,
      backgroundColor: 'transparent',
      textAlign: 'center'
    }
  },
  {
    id: '1014',
    name: '静谧蓝',
    preview: PREVIEW_PATH + '/silent-blue.png',
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#ADD8E6',
      stroke: { color: '#000000', width: 0 },
      shadow: { offsetX: 0, offsetY: 1, blur: 2, color: 'rgba(0,0,0,0.3)' },
      backgroundColor: 'transparent',
      textAlign: 'center'
    }
  }
];

// 精选静态模板 (6个)
export const FEATURED_STATIC_TEMPLATES = [
  STATIC_STYLE_TEMPLATES[0],
  STATIC_STYLE_TEMPLATES[1],
  STATIC_STYLE_TEMPLATES[3],
  STATIC_STYLE_TEMPLATES[4],
  STATIC_STYLE_TEMPLATES[6],
  STATIC_STYLE_TEMPLATES[12],
];