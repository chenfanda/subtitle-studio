import type { AnimationEffect } from '@/types/animation';

export interface SubtitlePosition {
  x: number;        // 水平位置百分比 (0-100)
  y: number;        // 垂直位置百分比 (0-100)
  scale?: number;   // 缩放比例 (默认 1.0)
  rotation?: number; // 旋转角度 (默认 0)
}

export interface SubtitleItem {
  id: string;
  startTime: number; // 毫秒
  endTime: number; // 毫秒
  text: string;
  speaker?: string; // 可选字段，支持多说话人
  style?: SubtitleStyle;
  trackIndex?: number; // 多轨道支持
  position?: SubtitlePosition; // 位置和变换信息
  animations?: AnimationEffect[]; // 动画效果
}

export interface SubtitleStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | 'bolder';
  fontStyle: 'normal' | 'italic';
  color: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  position: 'bottom' | 'top' | 'center';
  alignment: 'left' | 'center' | 'right';
  opacity: number;
  shadow: {
    enabled: boolean;
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
  };
}

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontSize: 24,
  fontFamily: 'Alibaba PuHuiTi, PingFang SC, Microsoft YaHei, sans-serif',
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#ffffff',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  position: 'bottom',
  alignment: 'center',
  opacity: 1,
  shadow: {
    enabled: true,
    color: '#000000',
    offsetX: 2,
    offsetY: 2,
    blur: 0,
  },
};

export const DEFAULT_SUBTITLE_POSITION: SubtitlePosition = {
  x: 50,        // 水平居中
  y: 85,        // 底部偏上位置
  scale: 1.0,   // 无缩放
  rotation: 0,  // 无旋转
};