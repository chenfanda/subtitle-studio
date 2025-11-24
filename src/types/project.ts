import type { TimelineSegment } from './videoSequence';

export interface ProjectState {
  id: string;
  title: string;
  videoUrl: string;
  duration: number; // 秒
  currentTime: number; // 秒
  
  globalTime: number;
  globalDuration: number;

  isPlaying: boolean;
  volume: number; // 0-100
  playbackRate: number; // 0.5, 1, 1.5, 2 等
  lastSaved: Date | null;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  editorHeight: number;
}

/**
 * 项目导出格式
 * 用于保存和加载完整的项目文件
 */
export interface ProjectExport {
  // 版本信息（用于未来兼容性检查）
  version: string;
  
  // 项目元数据
  metadata: {
    title: string;            // 项目名称
    createdAt: string;        // 创建时间（ISO 字符串）
    modifiedAt: string;       // 修改时间（ISO 字符串）
  };
  
  // 视频信息
  video: {
    url: string;              // 视频文件路径或 URL
    duration: number;         // 视频时长（秒）
  };
  
  // 核心内容（所有可见的编辑元素）
  content: {
    // 字幕数据（包含样式、位置、动画、配音、B-roll）
    subtitles: any[];         
    
    // 文字元素数据（包含样式、位置、变换）
    textElements: any[];      
    
    // 媒体元素数据（贴纸/GIF，包含位置、时间）
    placedMedia: any[];       
    placedBrolls: any[];     

    backgroundMusic: any | null;  
    videoSequenceSegments: TimelineSegment[];
  };
  

  settings: {
    watermark: any;
    referenceHeight?: number;          
  };
}


export interface ProjectLoadOptions {
  // 是否清空历史记录
  clearHistory?: boolean;
  
  // 是否重置 UI 状态
  resetUI?: boolean;
}

/**
 * 项目导出选项
 */
export interface ProjectExportOptions {
  // 是否包含视频 URL（可能是 blob URL，导出后无效）
  includeVideoUrl?: boolean;
  
  // 是否压缩（最小化 JSON）
  minify?: boolean;
}