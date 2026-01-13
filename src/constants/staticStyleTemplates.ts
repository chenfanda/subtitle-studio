import type { TextStyleTemplate } from '@/types/textStyle';

const PREVIEW_PATH = '/assets/templates/previews';

export const STATIC_STYLE_TEMPLATES: TextStyleTemplate[] = [
  // --- 1xxx 系列 (参考你提供的 JPG 列表进行视觉还原) ---
  {
    id: 'style-1000',
    name: '纯净白',
    preview: `${PREVIEW_PATH}/1000-c3e4b515e79342c8b0b05c5f2b2d4c93.jpg`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#FFFFFF',
      shadow: { offsetX: 0, offsetY: 2, blur: 4, color: 'rgba(0,0,0,0.5)' },
      textAlign: 'center'
    }
  },
  {
    id: 'style-1013',
    name: '明黄描边',
    preview: `${PREVIEW_PATH}/1013-d9084e89f0d94a60b4f5e43d8c593aa5.jpg`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#FFFF00',
      stroke: { color: '#000000', width: 3 }, // ✅ 修复：移除了 enabled
      textAlign: 'center'
    }
  },
  {
    id: 'style-1020',
    name: '经典黑框',
    preview: `${PREVIEW_PATH}/1020-9fc8c6447d234faf86164a9e02d13443.jpg`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 26,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: '4px 12px',
      borderRadius: 4,
      textAlign: 'center'
    }
  },
  {
    id: 'style-1030',
    name: '青色霓虹',
    preview: `${PREVIEW_PATH}/1030-ce97332685d54cada9b18ce4dbc4270c.jpg`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#00FFFF',
      shadow: { offsetX: 0, offsetY: 0, blur: 10, color: 'rgba(0, 255, 255, 0.8)' },
      textAlign: 'center'
    }
  },
  {
    id: 'style-1040',
    name: '樱花粉',
    preview: `${PREVIEW_PATH}/1040-94aa192d8dee408d956fb54e1f234007.jpg`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#FFC0CB',
      stroke: { color: '#FFFFFF', width: 2 },
      textAlign: 'center'
    }
  },
  {
    id: 'style-1060',
    name: '黑金',
    preview: `${PREVIEW_PATH}/1060-a165050058a849f79de39f8f926cb5ff.jpg`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#FFD700',
      stroke: { color: '#000000', width: 4 },
      textAlign: 'center'
    }
  },

  // --- 基于 PNG 蒙版的模板 (3, 6, 12, 16) ---
  {
    id: 'style-mask-3',
    name: '圆形背景',
    preview: `${PREVIEW_PATH}/3.d8c8f9d6.png`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#333333',
      backgroundImage: `url("${PREVIEW_PATH}/3.d8c8f9d6.png")`,
      backgroundSize: '100% 100%',
      padding: '10px 25px',
      minWidth: 120, // ✅ 修复：符合 string | number 类型
      textAlign: 'center'
    }
  },
  {
    id: 'style-mask-6',
    name: '标签栏',
    preview: `${PREVIEW_PATH}/6.c3c87be2.png`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 22,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#FFFFFF',
      backgroundImage: `url("${PREVIEW_PATH}/6.c3c87be2.png")`,
      backgroundSize: '100% 100%',
      padding: '12px 30px',
      minWidth: 150,
      textAlign: 'center'
    }
  },
  {
    id: 'style-mask-12',
    name: '便签',
    preview: `${PREVIEW_PATH}/12.f6bd82a6.png`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 20,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#1A1A1A',
      backgroundImage: `url("${PREVIEW_PATH}/12.f6bd82a6.png")`,
      backgroundSize: '100% 100%',
      padding: '20px 25px',
      minWidth: 140,
      textAlign: 'center'
    }
  },
  {
    id: 'style-mask-16',
    name: '边框',
    preview: `${PREVIEW_PATH}/16.f546c4b7.png`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#FFFFFF',
      backgroundImage: `url("${PREVIEW_PATH}/16.f546c4b7.png")`,
      backgroundSize: '100% 100%',
      padding: '15px 35px',
      textAlign: 'center'
    }
  },

  // --- 补全至 20 个 (参考剩余 JPG) ---
  {
    id: 'style-1110',
    name: '警告红',
    preview: `${PREVIEW_PATH}/1110-102b393b10b742088d623372bd82bfd3.jpg`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#FFFFFF',
      backgroundColor: '#D32F2F',
      padding: '5px 15px',
      textAlign: 'center'
    }
  },
  {
    id: 'style-1120',
    name: '活力橙',
    preview: `${PREVIEW_PATH}/1120-3fae7a9827c44539ab49b2d54932133f.jpg`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#FFFFFF',
      backgroundColor: '#FF9500',
      borderRadius: 20,
      padding: '8px 20px',
      textAlign: 'center'
    }
  },
  {
    id: 'style-1130',
    name: '森林绿',
    preview: `${PREVIEW_PATH}/1130-1258e3ad427b46bb9178686dad87b2ac.jpg`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#FFFFFF',
      backgroundColor: '#2E7D32',
      borderRadius: 4,
      padding: '6px 12px',
      textAlign: 'center'
    }
  },
  {
    id: 'style-1140',
    name: '柠檬黄',
    preview: `${PREVIEW_PATH}/1140-eace5fa8bac34d4fbd1afb8d3cefbd2c.jpg`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#000000',
      backgroundColor: '#FFEB3B',
      textAlign: 'center'
    }
  },
  {
    id: 'style-1160',
    name: '梦幻紫',
    preview: `${PREVIEW_PATH}/1160-28ed31b1c74944cb859394da4394b6c4.jpg`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#FFFFFF',
      backgroundColor: '#9C27B0',
      borderRadius: 8,
      padding: '8px 16px',
      textAlign: 'center'
    }
  },
  {
    id: 'style-1170',
    name: '芭比粉',
    preview: `${PREVIEW_PATH}/1170-29eb6b62d92c425f8bbfe54011f23e66.jpg`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#FFFFFF',
      backgroundColor: '#E91E63',
      padding: '6px 12px',
      textAlign: 'center'
    }
  },
  {
    id: 'style-1180',
    name: '深海蓝',
    preview: `${PREVIEW_PATH}/1180-071954f4d9814b34b19fc77307a698f2.jpg`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#FFFFFF',
      backgroundColor: '#0D47A1',
      textAlign: 'center'
    }
  },
  {
    id: 'style-1190',
    name: '天蓝色',
    preview: `${PREVIEW_PATH}/1190-9b2e059d2ef94b59828f5678fc01ecef.jpg`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#000000',
      backgroundColor: '#81D4FA',
      padding: '5px 10px',
      textAlign: 'center'
    }
  },
  {
    id: 'style-1210',
    name: '商务灰',
    preview: `${PREVIEW_PATH}/1210-c10f476af686474da1367f39d3ae4966.jpg`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#FFFFFF',
      backgroundColor: '#455A64',
      textAlign: 'center'
    }
  },
  {
    id: 'style-1860-alt',
    name: '现代黑',
    preview: `${PREVIEW_PATH}/1860-010fc0627e6a4dd3abb62ac7d2f15746.jpg`,
    category: 'basic',
    style: {
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#FFFFFF',
      backgroundColor: '#212121',
      padding: '10px 20px',
      textAlign: 'center'
    }
  }
];

// 精选静态模板 (6个)
export const FEATURED_STATIC_TEMPLATES = [
  STATIC_STYLE_TEMPLATES[0], 
  STATIC_STYLE_TEMPLATES[1], 
  STATIC_STYLE_TEMPLATES[2], 
  STATIC_STYLE_TEMPLATES[5], 
  STATIC_STYLE_TEMPLATES[10], 
  STATIC_STYLE_TEMPLATES[14], 
];