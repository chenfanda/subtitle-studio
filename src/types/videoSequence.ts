export type TimelineSegmentType = 'main' | 'insert' | 'cut';

export interface TimelineSegment {
  id: string;
  type: TimelineSegmentType;
  sourceUrl: string;
  sourceStartTime: number;
  duration: number;
  globalStartTime: number;
}