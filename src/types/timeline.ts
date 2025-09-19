export interface TimelineState {
  pixelsPerSecond: number;
  scrollPosition: number;
  viewportWidth: number;
  selectedRange: {
    start: number;
    end: number;
  } | null;
  snapEnabled: boolean;
  snapThreshold: number; // 毫秒
}

export interface TrackItem {
  id: string;
  type: 'subtitle' | 'audio' | 'video';
  startTime: number;
  endTime: number;
  data: any; // 根据 type 不同，存储不同的数据
}