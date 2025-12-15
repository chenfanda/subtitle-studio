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

export interface BrollVideoData {
  video: BrollVideo;
  volume: number;              
  startOffset?: number;         
  transition: BrollTransition; 
}