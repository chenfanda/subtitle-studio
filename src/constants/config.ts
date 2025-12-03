export const APP_CONFIG = {
  // 视频播放
  DEFAULT_VOLUME: 80,
  DEFAULT_PLAYBACK_RATE: 1,
  SUPPORTED_VIDEO_FORMATS: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
  SUPPORTED_SUBTITLE_FORMATS: ['.srt', '.vtt', '.ass'],
  
  // 时间轴
  DEFAULT_PIXELS_PER_SECOND: 50,
  MIN_PIXELS_PER_SECOND: 10,
  MAX_PIXELS_PER_SECOND: 200,
  TIMELINE_HEIGHT: 180,
  
  // 字幕
  MAX_SUBTITLE_LENGTH: 100,
  MIN_SUBTITLE_DURATION: 500, // 毫秒
  MAX_SUBTITLE_DURATION: 10000, // 毫秒
  
  // UI
  LEFT_PANEL_WIDTH: 400,
  MIN_LEFT_PANEL_WIDTH: 300,
  MAX_LEFT_PANEL_WIDTH: 600,
  HEADER_HEIGHT: 48,
  
  // 性能
  SUBTITLE_RENDER_BUFFER: 5000, // 毫秒，预渲染缓冲区
  WAVEFORM_SAMPLES_PER_PIXEL: 4,
} as const;


export const API_CONFIG = {
  BASE_URL: 'http://localhost:8008', 
  
  ENDPOINTS: {

    UPLOAD_AND_PROCESS: '/transcribe', 
    
    // 其他预留接口
    EXPORT: '/api/export',
    UPLOAD: '/api/upload',
  },
  
  UPLOAD: {
    MAX_SIZE: 500 * 1024 * 1024, 
    ACCEPTED_TYPES: ['video/mp4', 'video/quicktime', 'video/x-matroska']
  }
} as const;
