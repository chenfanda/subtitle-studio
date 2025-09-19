// 设计系统样式常量

export const COLORS = {
  // 背景色
  BG_PRIMARY: '#1a1a1a',
  BG_SECONDARY: '#2a2a2a',
  BG_TERTIARY: '#3a3a3a',
  BG_ELEVATED: '#404040',
  
  // 文字色
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#d1d5db',
  TEXT_TERTIARY: '#9ca3af',
  TEXT_DISABLED: '#6b7280',
  
  // 主题色
  ACCENT_PURPLE: '#8b5cf6',
  ACCENT_BLUE: '#3b82f6',
  ACCENT_GREEN: '#10b981',
  ACCENT_RED: '#ef4444',
  ACCENT_YELLOW: '#f59e0b',
  
  // 边框色
  BORDER_PRIMARY: '#4a4a4a',
  BORDER_SECONDARY: '#3a3a3a',
} as const;

export const FONTS = {
  PRIMARY: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  MONO: 'SF Mono, Monaco, Cascadia Code, monospace',
  CHINESE: 'Alibaba PuHuiTi, PingFang SC, Microsoft YaHei, sans-serif',
} as const;

export const FONT_SIZES = {
  XS: '12px',
  SM: '14px',
  BASE: '16px',
  LG: '18px',
  XL: '20px',
  XXL: '24px',
} as const;

export const TRANSITIONS = {
  FAST: '150ms',
  NORMAL: '300ms',
  SLOW: '500ms',
} as const;

export const Z_INDEX = {
  TIMELINE: 10,
  PLAYHEAD: 20,
  MODAL_BACKDROP: 40,
  MODAL: 50,
  TOOLTIP: 60,
} as const;