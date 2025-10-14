export interface BrollVideo {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  duration: number;
  tags: string[];
  relevanceScore?: number;
}

export interface BrollRecommendation {
  subtitleId: string;
  keywords: string[];
  suggestions: BrollVideo[];
}

export interface BrollPlacement {
  brollVideo: BrollVideo;
  startTime: number;
  endTime: number;
  volume: number;
}
// 过渡动画类型（新增）
export type BrollTransition = 'none' | 'fade' | 'glow';

export interface BrollVideo {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  duration: number;
  tags: string[];
  relevanceScore?: number;
}

export interface BrollRecommendation {
  subtitleId: string;
  keywords: string[];
  suggestions: BrollVideo[];
}

export interface BrollPlacement {
  brollVideo: BrollVideo;
  startTime: number;
  endTime: number;
  volume: number;
}

// B-roll应用数据（新增，替代 BrollPlacement 用于字幕级别）
export interface BrollVideoData {
  video: BrollVideo;
  volume: number;              // 音量 0-100
  startOffset?: number;         // 从视频哪个位置开始播放（秒）
  transition: BrollTransition;  // 过渡动画类型
}