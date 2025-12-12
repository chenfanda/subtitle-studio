export interface VoiceCharacter {
  id: string;
  name: string;
  gender: string; // 'male' | 'female' | 'other'
  description?: string;
  avatar_url?: string; // 如果后端支持头像
  tags?: string[];     // e.g. ['happy', 'news', 'story']
  preview_audio_url?: string; 
}

export interface UserCustomVoice {
  voice_id: string;
  username: string;
  voice_name: string;
  description?: string;
  preview_audio_path?: string;
  created_at: string;
}

export interface SubtitleVoiceConfig {
  characterId: string;      
  name: string;             
  type: 'system' | 'custom';
  speed?: number;           // 语速 (默认 1.0)
  pitch?: number;           // 音调 (默认 1.0)
}

export interface TimelineDialogueLine {
  text: string;
  character: string;        // 角色ID
  start_time: number;       // 秒
  end_time: number;         // 秒
  speed?: number;
  pitch?: number;
  emotion?:string;  
}


export interface TimelineDialogueRequest {
  dialogue_lines: TimelineDialogueLine[];
  output_format?: string; // 'wav'
}


export interface TimelineDialogueResponse {
  results: {
    index: number;          
    text: string;
    audio_id: string;       
    duration: number;
    file_size?: number;
    file_url?: string;      
  }[];
  total_time: number;
}


export interface TTSResponse {
  audio_id: string;
  status: string;
  audio_url?: string; 
}