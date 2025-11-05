import type { SubtitleItem } from './subtitle';
import type { TextElement } from './textElement';
import type { TimelineSegment } from './videoSequence';
export interface ProjectSnapshot {
  subtitles: SubtitleItem[];
  textElements: TextElement[];
  placedMedia: any[];
  placedBrolls: any[];
  backgroundMusic: any | null;
  videoSequenceSegments: TimelineSegment[];
  timestamp: number;
}

export interface HistoryState {
  past: ProjectSnapshot[];
  future: ProjectSnapshot[];
  maxHistory: number;
  isBatching: boolean;
  batchStartSnapshot: ProjectSnapshot | null;
  isRestoring: boolean;
}

export type HistoryActionType = 
  | 'ADD_SUBTITLE'
  | 'UPDATE_SUBTITLE'
  | 'DELETE_SUBTITLE'
  | 'SPLIT_SUBTITLE'
  | 'MERGE_SUBTITLES'
  | 'ADD_TEXT_ELEMENT'
  | 'UPDATE_TEXT_ELEMENT'
  | 'DELETE_TEXT_ELEMENT'
  | 'ADD_MEDIA'
  | 'UPDATE_MEDIA'
  | 'DELETE_MEDIA'
  | 'ADD_BROLL'
  | 'UPDATE_BROLL'
  | 'DELETE_BROLL'
  | 'APPLY_STYLE'
  | 'APPLY_ANIMATION'
  | 'BATCH_OPERATION'
  | 'UNKNOWN';

export interface HistoryMetadata {
  action: HistoryActionType;
  description?: string;
  timestamp: number;
}

export interface SnapshotWithMetadata {
  snapshot: ProjectSnapshot;
  metadata: HistoryMetadata;
}