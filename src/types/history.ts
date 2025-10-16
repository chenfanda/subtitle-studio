/**
 * 历史记录（Undo/Redo）类型定义
 */

import type { SubtitleItem } from './subtitle';
import type { TextElement } from './textElement';

/**
 * 项目快照
 * 包含所有可撤销的内容数据，不包括 UI 状态、播放状态等
 */
export interface ProjectSnapshot {
  // 字幕数据（包含样式、位置、动画、配音、B-roll）
  subtitles: SubtitleItem[];
  
  // 文字元素数据（包含样式、位置、变换）
  textElements: TextElement[];
  
  // 媒体元素数据（贴纸/GIF，包含位置、时间）
  placedMedia: any[];  // PlacedMediaItem[] - 从 useMediaStore
  
  // B-roll 数据（独立的 B-roll，不依附字幕）
  placedBrolls: any[];  // BrollPlacement[] - 从 useBrollStore
  
  // 背景音乐
  backgroundMusic: any | null;  // AudioTrack | null - 从 useAudioStore
  
  // 时间戳（用于调试和记录）
  timestamp: number;
}

/**
 * 历史记录状态
 */
export interface HistoryState {
  // 历史记录栈（过去的状态）
  past: ProjectSnapshot[];
  
  // 重做记录栈（未来的状态）
  future: ProjectSnapshot[];
  
  // 最大历史记录数
  maxHistory: number;
  
  // 批量操作标志（批量操作时暂停记录）
  isBatching: boolean;
  
  // 批量操作的临时快照
  batchStartSnapshot: ProjectSnapshot | null;
}

/**
 * 历史操作类型
 */
export type HistoryActionType = 
  | 'ADD_SUBTITLE'
  | 'UPDATE_SUBTITLE'
  | 'DELETE_SUBTITLE'
  | 'SPLIT_SUBTITLE'
  | 'MERGE_SUBTITLES'
  | 'ADD_TEXT_ELEMENT'
  | 'UPDATE_TEXT_ELEMENT'
  | 'DELETE_TEXT_ELEMENT'
  | 'APPLY_STYLE'
  | 'APPLY_ANIMATION'
  | 'BATCH_OPERATION'
  | 'UNKNOWN';

/**
 * 历史记录元数据（可选，用于显示操作历史）
 */
export interface HistoryMetadata {
  action: HistoryActionType;
  description?: string;
  timestamp: number;
}

/**
 * 带元数据的快照（扩展版本，未来可用）
 */
export interface SnapshotWithMetadata {
  snapshot: ProjectSnapshot;
  metadata: HistoryMetadata;
}