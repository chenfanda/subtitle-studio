import type { TextStyleTemplate } from '@/types/textStyle';

const ASSET_PATH = '/assets/text-bg';

// 辅助生成函数
const createNote = (id: string, imgName: string, name: string) => ({
  id,
  name,
  preview: 'Text',
  category: 'note' as const,
  style: {
    fontFamily: 'Arial',
    fontSize: 20,
    fontWeight: 'normal' as const,
    fontStyle: 'normal' as const,
    color: '#000000',
    backgroundImage: `url("${ASSET_PATH}/${imgName}")`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    padding: '25px 30px', // 便签需要较大的内边距
    textAlign: 'center' as const,
    minWidth: '120px', // 防止图片压扁
    minHeight: '60px'
  }
});

const createTitle = (id: string, imgName: string, name: string) => ({
  id,
  name,
  preview: 'Title',
  category: 'title' as const,
  style: {
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: 'bold' as const,
    fontStyle: 'normal' as const,
    color: '#FFFFFF',
    backgroundImage: `url("${ASSET_PATH}/${imgName}")`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    padding: '15px 35px', // 标题通常是横幅，左右padding大
    textAlign: 'center' as const,
    minWidth: '150px'
  }
});

const createSocial = (id: string, iconName: string, name: string, bgColor = '#FFFFFF', textColor = '#000000') => ({
  id,
  name,
  preview: name,
  category: 'socialMedia' as const,
  style: {
    fontFamily: 'Arial',
    fontSize: 16,
    fontWeight: 'bold' as const,
    fontStyle: 'normal' as const,
    color: textColor,
    backgroundColor: bgColor,
    borderRadius: 50, // 圆角胶囊形状
    padding: '8px 20px 8px 8px', // 左侧给icon留空间
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '8px',
    icon: `${ASSET_PATH}/${iconName}`,
    iconSize: 24,
    minWidth: '100px'
  }
});

export const TEXT_STYLE_TEMPLATES: Record<string, TextStyleTemplate[]> = {
  basic: [
    {
      id: 'basic-1',
      name: 'Modern Clean',
      preview: 'Text',
      category: 'basic',
      style: {
        fontFamily: 'Arial',
        fontSize: 32,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#FFFFFF',
        // 关键优化：增加柔和的投影，提升在亮色视频上的可读性，但不显脏
        shadow: { color: 'rgba(0,0,0,0.5)', blur: 4, offsetX: 0, offsetY: 2 },
        textAlign: 'center'
      }
    },
    {
      id: 'basic-2',
      name: 'Cinematic Box',
      preview: 'Caption',
      category: 'basic',
      style: {
        fontFamily: 'Arial',
        fontSize: 30, // 稍微调小一点，更精致
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#FFFFFF',
        // 关键优化：使用半透明黑色背景 (#00000099) 而不是纯黑
        backgroundColor: 'rgba(0, 0, 0, 0.6)', 
        padding: '8px 16px', // 增加呼吸感
        borderRadius: 8,     // 现代 UI 标配的圆角
        textAlign: 'center'
      }
    },
    {
      id: 'basic-3',
      name: 'Pop Highlight',
      preview: 'Focus',
      category: 'basic',
      style: {
        fontFamily: 'Arial',
        fontSize: 32,
        fontWeight: 'bold',
        fontStyle: 'normal',
        // 关键优化：使用深灰色 (#1a1a1a) 代替纯黑，背景用暖金色 (#FFD700) 代替刺眼荧光黄
        color: '#1A1A1A',
        backgroundColor: '#FFD700',
        padding: '6px 14px',
        borderRadius: 6,
        textAlign: 'center',
        // 稍微加一点点投影增加立体感
        shadow: { color: 'rgba(0,0,0,0.15)', blur: 4, offsetX: 0, offsetY: 2 }
      }
    }
  ],
  socialMedia: [
    // 社交媒体 - 红色系/品牌色模拟
    createSocial('social-1', 'social_textcard_icon_1.png', 'WECHAT', '#FFFFFF', '#07C160'),
    createSocial('social-2', 'social_textcard_icon_2.png', 'YOUTUBE', '#FFFFFF', '#FF0000'), // Icon 2 看起来像 YT
    createSocial('social-4', 'social_textcard_icon_4.png', 'WEBSITE', '#FFFFFF', '#333333'),
    createSocial('social-5', 'social_textcard_icon_5.png', 'ACCOUNT', '#FFFFFF', '#000000'),
    createSocial('social-19', 'social_textcard_icon_19.png', 'XIAOHONGSHU', '#FFFFFF', '#FF2442'),
    
    
    // 社交媒体 - Instagram/Tiktok 风格
    createSocial('social-6', 'social_textcard_icon_6.png', 'FOLLOW', 'transparent', '#FFFFFF'),
    createSocial('social-7', 'social_textcard_icon_7.png', 'LIKE', 'transparent', '#FFFFFF'),
    createSocial('social-21', 'social_textcard_icon_21.png', 'KWAI', '#FFFFFF', '#FF5000'),
    createSocial('social-20', 'social_textcard_icon_20.png', 'CHANNELS', '#FFFFFF', '#FA9D3B'),
    // 更多图标
    createSocial('social-8', 'social_textcard_icon_8.png', 'SHARE', 'transparent', '#FFFFFF'),
    createSocial('social-9', 'social_textcard_icon_9.png', 'COMMENT', 'transparent', '#FFFFFF'),
    createSocial('social-10', 'social_textcard_icon_10.png', 'SOCIAL', 'transparent', '#FFFFFF'),
    createSocial('social-11', 'social_textcard_icon_11.png', 'LINK', 'transparent', '#FFFFFF'),
    createSocial('social-12', 'social_textcard_icon_12.png', 'PROFILE', 'transparent', '#FFFFFF'),
    createSocial('social-13', 'social_textcard_icon_13.png', 'SNAP', 'transparent', '#FFFFFF'),
    createSocial('social-14', 'social_textcard_icon_14.png', 'CHAT', 'transparent', '#FFFFFF'),
    createSocial('social-15', 'social_textcard_icon_15.png', 'MUSIC', 'transparent', '#FFFFFF'),
    createSocial('social-16', 'social_textcard_icon_16.png', 'THUMBS UP', 'transparent', '#FFFFFF'),
    createSocial('social-17', 'social_textcard_icon_17.png', 'STAR', 'transparent', '#FFFFFF'),
    createSocial('social-18', 'social_textcard_icon_18.png', 'HEART', 'transparent', '#FFFFFF'),
  ],

  title: [
    // 标题背景 2-n-1 系列
    createTitle('title-2-1-1', '2-1-1.png', 'Title 01'),
    createTitle('title-2-2-1', '2-2-1.png', 'Title 02'),
    createTitle('title-2-3-1', '2-3-1.png', 'Title 03'),
    createTitle('title-2-4-1', '2-4-1.png', 'Title 04'),
    createTitle('title-2-5-1', '2-5-1.png', 'Title 05'),
    createTitle('title-2-6-1', '2-6-1.png', 'Title 06'),
    createTitle('title-2-7-1', '2-7-1.png', 'Title 07'),
    createTitle('title-2-8-1', '2-8-1.png', 'Title 08'),
    createTitle('title-2-9-1', '2-9-1.png', 'Title 09'),
    createTitle('title-2-10-1', '2-10-1.png', 'Title 10'),
    createTitle('title-2-11-1', '2-11-1.png', 'Title 11'),
    createTitle('title-2-12-1', '2-12-1.png', 'Title 12'),
    createTitle('title-2-13-1', '2-13-1.png', 'Title 13'),
    createTitle('title-2-14-1', '2-14-1.png', 'Title 14'),
  ],

  note: [
    // 便签 1-n 系列
    createNote('note-1-1', '1-1.png', 'Note 1'),
    createNote('note-1-2', '1-2.png', 'Note 2'),
    createNote('note-1-3', '1-3.png', 'Note 3'),
    createNote('note-1-4', '1-4.png', 'Note 4'),
    createNote('note-1-5', '1-5.png', 'Note 5'),
    
    // 便签 2-n 系列
    createNote('note-2-1', '2-1.png', 'Memo 1'),
    createNote('note-2-2', '2-2.png', 'Memo 2'),
    createNote('note-2-3', '2-3.png', 'Memo 3'),
    createNote('note-2-4', '2-4.png', 'Memo 4'),
    createNote('note-2-5', '2-5.png', 'Memo 5'),
  ]
};