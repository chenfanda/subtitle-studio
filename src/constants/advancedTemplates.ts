import { AdvancedSceneTemplate } from '@/types/animation';

const DECO_PATH = '/assets/templates/decorations';

export const ADVANCED_SCENE_TEMPLATES: AdvancedSceneTemplate[] = [
  {
    id: 'scene-christmas-01',
    name: '圣诞狂欢',
    preview: '/assets/templates/previews/christmas_preview.webp',
    category: 'scene',
    layers: [
    {
      type: 'environment',
      config: {
        type: 'snow',
        asset: `${DECO_PATH}/snowflake_shape.png`,
        density: 20,     
        speed: 1.2,
        opacity: 0.9,
        renderMode: 'particle',
        brightness: 2.5   
      }
    },
      {
        type: 'decoration',
        config: {
          id: 'reindeer',
          asset: `${DECO_PATH}/reindeer.png`,
          position: 'left-bottom',
          animation: 'jumping-move',
          scale: 0.5,
          moveX: 180,
          moveY: -100,
          frequency: 1.5,
          amplitude: 1.2,
          offsetX: 30,
          offsetY: 20,
          flipX: true,
        }
      },
      {
        type: 'decoration',
        config: {
          id: 'santa',
          asset: `${DECO_PATH}/santa_claus.png`,
          position: 'left-top',
          animation: 'swing',
          scale: 0.65,
          frequency: 0.8,
          amplitude: 1.5,
          offsetY: -80,
          offsetX: -50,
          flipX: true,
        }
      },
        {
        type: 'decoration',
        config: {
          id: 'tree',
          asset: `${DECO_PATH}/christmas_tree.png`,
          position: 'right-top',
          animation: 'breathing',
          scale: 0.65,
          frequency: 0.8,
          amplitude: 1.5,
          offsetY: -100,
          offsetX: -40,
          flipX: true,
        }
      },
      {
        type: 'decoration',
        config: {
          id: 'tree-decor',
          asset: `${DECO_PATH}/christmas_decor.png`,
          position: 'right-top',
          animation: 'floating',
          scale: 0.65,
          frequency: 0.8,
          amplitude: 1.5,
          offsetY: -150,
          offsetX: -80,
          flipX: true,
        }
      },
      {
        type: 'text',
        config: {
          glow: { color: 'rgba(255, 255, 255, 0.9)', blur: 15 },
          physics: { curve: 'elastic', emphasisScale: 1.3 },
          karaokeConfig: {
            type: 'karaoke',
            activeStyle: { color: '#FF2400', fontWeight: 900 },
            inactiveStyle: { color: '#FFFFFF', fontWeight: 500 },
            emphasisType: 'pop',
            emphasisValue: 1.2
          }
        }
      }
    ]
  },
  {
    id: 'scene-china-style-01',
    name: '国潮麋鹿',
    preview: '/assets/templates/previews/china_preview.webp',
    category: 'scene',
    layers: [
      {
        type: 'environment',
        config: {
          type: 'meteor',
          renderMode: 'particle',
          asset: `${DECO_PATH}/meteor.png`,
          density: 8,
          speed: 2.5,
          opacity: 0.9
        }
      },
      {
        type: 'decoration',
        config: {
          id: 'china-deer',
          asset: `${DECO_PATH}/china_style_deer.png`,
          position: 'center-top',
          animation: 'floating',
          scale: 0.8,
          frequency: 0.8,
          amplitude: 1.5,
          offsetY: -50
        }
      },
      {
        type: 'text',
        config: {
          activeColor: '#FFD700',
          inactiveColor: '#C00000',
          physics: { curve: 'elastic', emphasisScale: 1.25 },
          rotation: 8,
          karaokeConfig: {
            type: 'karaoke',
            activeStyle: { color: '#FFD700', fontWeight: 800 },
            inactiveStyle: { color: '#FF4500', fontWeight: 400 },
            emphasisType: 'pop',
            emphasisValue: 1.15
          }
        }
      }
    ]
  },
  {
    id: 'scene-social-01',
    name: '点赞互动',
    preview: '/assets/templates/previews/social_preview.webp',
    category: 'scene',
    layers: [
      {
        type: 'decoration',
        config: {
          id: 'like-icon',
          asset: `${DECO_PATH}/like_icon.png`,
          position: 'left-top',
          animation: 'heart-beat',
          scale: 0.5,
          frequency: 2.0,
          amplitude: 1.3,
          offsetX: 100,
          offsetY: -100
        }
      },
      {
        type: 'text',
        config: {
          glow: { color: '#00F2EA', blur: 20 },
          physics: { curve: 'stiff', emphasisScale: 1.4 },
          karaokeConfig: {
            type: 'karaoke',
            activeStyle: { color: '#00F2EA', fontWeight: 900 },
            inactiveStyle: { color: '#FFFFFF', fontWeight: 600 },
            emphasisType: 'pop',
            emphasisValue: 1.2
          }
        }
      }
    ]
  },
 {
    id: 'scene-phoenix-01',
    name: '凤凰呈祥',
    preview: '/assets/templates/previews/phoenix_preview.webp',
    category: 'scene',
    layers: [
      {
        type: 'environment',
        config: { type: 'snow', renderMode: 'scrolling', asset: `${DECO_PATH}/gold_particles.png`, speed: 1.5, opacity: 0.5 }
      },
        {
      type: 'decoration',
      config: {
        id: 'phoenix',
        asset: `${DECO_PATH}/phoenix.png`,
        position: 'left-bottom', 
        animation: 'arc-move',
        moveX: 200,  
        moveY: -100, 
        scale: 0.7,
        offsetY: -30, 
        flipX: false,
      }
    },
      {
        type: 'text',
        config: {
          activeColor: '#FFD700',
          physics: { curve: 'elastic', emphasisScale: 1.3 },
          rotation: -5, 
          karaokeConfig: {
            type: 'karaoke',
            activeStyle: { color: '#FFD700', fontWeight: 900 },
            inactiveStyle: { color: '#E6B422', opacity: 0.7 },
            emphasisType: 'pop'
          }
        }
      }
    ]
  },
  {
    id: 'scene-dunhuang-01',
    name: '敦煌幻梦',
    preview: '/assets/templates/previews/dunhuang_preview.webp',
    category: 'scene',
    layers: [
      {
        type: 'environment',
        config: { type: 'meteor', renderMode: 'particle', asset: `${DECO_PATH}/meteor.png`, density: 5, speed: 2.5 }
      },
       {
      type: 'decoration',
      config: {
        id: 'apsaras',
        asset: `${DECO_PATH}/dunhuang_apsaras.png`,
        position: 'left-bottom', 
        animation: 'arc-move',
        moveX: 150, 
        scale: 0.7,
        moveY: -100, 
        offsetY: -30, 
        flipX: false 
      }
    },
      {
        type: 'text',
        config: {
          activeColor: '#5D945A', 
          physics: { curve: 'smooth', emphasisScale: 1.1 },
          rotation: 3,
          karaokeConfig: {
            type: 'karaoke',
            activeStyle: { color: '#5D945A', fontWeight: 700 },
            inactiveStyle: { color: '#E6B422' },
            emphasisType: 'glow'
          }
        }
      }
    ]
  },
  {
    id: 'scene-anime-girl-01',
    name: '动漫之夏',
    preview: '/assets/templates/previews/anime_girl_preview.webp',
    category: 'scene',
    layers: [
      {
        type: 'decoration',
        config: {
          id: 'rainbow',
          asset: `${DECO_PATH}/rainbow.png`,
          position: 'center-top',
          animation: 'floating',
          scale: 1.0,
          offsetY: -80
        }
      },
      {
        type: 'decoration',
        config: {
          id: 'girl',
          asset: `${DECO_PATH}/anime_girl.png`,
          position: 'right-bottom',
          animation: 'breathing', 
          scale: 0.8,
          offsetX: 10
        }
      },
      {
        type: 'text',
        config: {
          activeColor: '#FF69B4',
          physics: { curve: 'smooth', emphasisScale: 1.2 },
          karaokeConfig: {
            type: 'karaoke',
            activeStyle: { color: '#FF69B4' },
            inactiveStyle: { color: '#00BFFF' },
            emphasisType: 'pop'
          }
        }
      }
    ]
  },
    {
    id: 'scene-liquid-capsule-01',
    name: '极速液态胶囊',
    preview: '', 
    category: 'scene',
    layers: [
      {
        type: 'text',
        config: {
          activeColor: '#000000',
          inactiveColor: '#FFFFFF', 
          background: {
            color: '#FFFF00', 
            padding: '4px 12px',
            borderRadius: '12px',
            animation: 'pop-elastic'
          },
          physics: {
            curve: 'elastic',
            emphasisScale: 1.2 
          },
          karaokeConfig: {
            type: 'karaoke',
            activeStyle: { fontWeight: 900 },
            inactiveStyle: { fontWeight: 400, opacity: 0.8 },
            emphasisType: 'bounce', 
            emphasisValue: 1.2
          }
        }
      }
    ]
  },
  {
  id: 'scene-wealth-god-01',
  name: '财神送福',
  category: 'scene',
  layers: [
    {
      type: 'environment',
      config: {
        type: 'snow', // 使用下落逻辑
        asset: `${DECO_PATH}/gold_ingot.png`,
        density: 15,
        speed: 1.8,
        opacity: 0.8,
        renderMode: 'particle'
      }
    },
    {
      type: 'decoration',
      config: {
        id: 'wealth-god',
        asset: `${DECO_PATH}/horse_year_wealth_god.png`,
        position: 'center-bottom',
        animation: 'breathing', // 呼吸动感
        scale: 0.9,
        frequency: 0.6,
        amplitude: 1.1,
        offsetY: -20
      }
    },
    {
      type: 'text',
      config: {
        glow: { color: '#FFD700', blur: 20 }, // 金色发光边缘
        karaokeConfig: {
          type: 'karaoke',
          activeStyle: { color: '#FF0000', fontWeight: 900 }, // 激活时红色
          inactiveStyle: { color: '#FFD700', fontWeight: 600 }, // 未激活金色
          emphasisType: 'pop',
          emphasisValue: 1.3
        }
      }
    }
  ]
},
{
  id: 'scene-new-year-01',
  name: '新春大吉',
  category: 'scene',
  layers: [
    {
      type: 'environment',
      config: {
        type: 'meteor', 
        asset: `${DECO_PATH}/red_envelope.png`,
        density: 5,
        speed: 1.5,
        opacity: 1.0
      }
    },
      {
        type: 'decoration',
        config: {
          id: 'horse_year_fuwa',
          asset: `${DECO_PATH}/horse_year_fuwa.png`,
          position: 'left-top',
          animation: 'swing',
          scale: 0.65,
          frequency: 0.8,
          amplitude: 1.5,
          offsetY: -120,
          offsetX: -50,
          flipX: false,
        }
      },
      {
        type: 'decoration',
        config: {
          id: 'firecrackers',
          asset: `${DECO_PATH}/firecrackers.png`,
          position: 'right-top',
          animation: 'floating',
          scale: 0.65,
          frequency: 0.8,
          amplitude: 1.5,
          offsetY: -150,
          offsetX: -80,
          flipX: true,
        }
      },
    {
      type: 'text',
      config: {
        background: {
          color: 'rgba(255, 0, 0, 0.8)', 
          padding: '6px 15px',
          borderRadius: '20px',
          animation: 'pop-elastic'
        },
        karaokeConfig: {
          type: 'karaoke',
          activeStyle: { color: '#FFFF00' }, 
          inactiveStyle: { color: '#FFFFFF' },
          emphasisType: 'bounce'
        }
      }
    }
  ]
},

];