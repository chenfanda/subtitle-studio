// 开发环境(npm run dev): 使用相对路径 '/api'
// 生产环境: 使用环境变量
const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || '/api';

export const API_CLIENT = {
  // 基础地址
  BASE_URL: GATEWAY_URL,

  // 所有功能端点 (全部发给 Node.js 主后端)
  ENDPOINTS: {
    UPLOAD_FILE: `${GATEWAY_URL}/upload`,            
    PROCESS_MEDIA: `${GATEWAY_URL}/process-media`,   
    EXPORT_PROJECT: `${GATEWAY_URL}/export`,         
    CHECK_STATUS: `${GATEWAY_URL}/status`,           
    CANCEL_JOB: `${GATEWAY_URL}/cancel`,             
    
  
    TTS: {
      CHARACTERS: `${GATEWAY_URL}/tts/characters`,
      USER_VOICES: `${GATEWAY_URL}/tts/user_custom_voices`,
      SAVE_VOICE: `${GATEWAY_URL}/tts/save_custom_voice`,
      GENERATE_CHAR: `${GATEWAY_URL}/tts/tts_with_character`,
      GENERATE_CUSTOM: `${GATEWAY_URL}/tts/tts_with_custom_voice`,
      GENERATE_TIMELINE: `${GATEWAY_URL}/tts/tts_timeline_dialogue`,
      DOWNLOAD: `${GATEWAY_URL}/tts/download`,
    }
  }
};