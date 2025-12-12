import { 
  VoiceCharacter, 
  UserCustomVoice, 
  TTSResponse, 
  TimelineDialogueRequest, 
  TimelineDialogueResponse 
} from '@/types/tts';
import { API_CLIENT } from '@/config/api-client';

const ENDPOINTS = API_CLIENT.ENDPOINTS.TTS;

// --- 新增：数值转后端字符串参数的辅助函数 ---
function mapParamToBackendString(value: number): string {
  if (value <= 0.6) return 'very_low';
  if (value <= 0.8) return 'low';
  if (value <= 1.2) return 'moderate'; // 0.9 - 1.2 视为正常
  if (value <= 1.6) return 'high';
  return 'very_high';
}

export const ttsService = {
  fetchSystemCharacters: async (): Promise<VoiceCharacter[]> => {
    const response = await fetch(ENDPOINTS.CHARACTERS);
    if (!response.ok) throw new Error('Failed to fetch system characters');
    return response.json();
  },

  fetchUserVoices: async (username: string): Promise<UserCustomVoice[]> => {
    const response = await fetch(`${ENDPOINTS.USER_VOICES}/${username}`);
    if (!response.ok) throw new Error('Failed to fetch user voices');
    return response.json();
  },

  saveCustomVoice: async (
    username: string,
    voiceName: string,
    text: string,
    audioBlob: Blob,
    description?: string
  ): Promise<UserCustomVoice> => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('voice_name', voiceName);
    formData.append('text', text);
    if (description) formData.append('description', description);
    
    formData.append('audio_file', audioBlob, `voice_${Date.now()}.wav`);

    const response = await fetch(ENDPOINTS.SAVE_VOICE, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to save custom voice');
    }

    const data = await response.json();
    return {
      voice_id: data.voice_id,
      username: username,
      voice_name: voiceName,
      created_at: new Date().toISOString(),
    };
  },

  generateWithCharacter: async (
    text: string,
    characterId: string,
    speed: number = 1.0,
    pitch: number = 1.0
  ): Promise<TTSResponse> => {
    // [修复] 将数字转换为后端要求的字符串
    const speedStr = mapParamToBackendString(speed);
    const pitchStr = mapParamToBackendString(pitch);

    const response = await fetch(ENDPOINTS.GENERATE_CHAR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        character_id: characterId,
        speed: speedStr, // 发送字符串
        pitch: pitchStr  // 发送字符串
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'TTS generation failed');
    }
    return response.json();
  },

  generateWithCustomVoice: async (
    text: string,
    username: string,
    voiceId: string,
    speed: number = 1.0,
    pitch: number = 1.0
  ): Promise<TTSResponse> => {
    // [修复] 同样应用于自定义音色
    const speedStr = mapParamToBackendString(speed);
    const pitchStr = mapParamToBackendString(pitch);

    const formData = new FormData();
    formData.append('text', text);
    formData.append('username', username);
    formData.append('voice_id', voiceId);
    formData.append('speed', speedStr);
    formData.append('pitch', pitchStr);

    const response = await fetch(ENDPOINTS.GENERATE_CUSTOM, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Custom TTS generation failed');
    }
    return response.json();
  },

  generateTimelineDialogue: async (
    request: TimelineDialogueRequest
  ): Promise<TimelineDialogueResponse> => {
    // 批量生成可能也需要转换，但这里暂时保留原样，假设后端批量接口处理逻辑一致
    // 如果批量接口也报错 422，需要在调用处进行转换
    const payload = {
      ...request,
      dialogue_lines: request.dialogue_lines.map(line => ({
        ...line,
        start_time: line.start_time / 1000,
        end_time: line.end_time / 1000,
        // 如果后端 timeline 接口也强校验 speed 类型，这里也需要 mapParamToBackendString
      }))
    };

    const response = await fetch(ENDPOINTS.GENERATE_TIMELINE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Timeline generation failed');
    return response.json();
  },

  downloadAudioAsBlobUrl: async (audioId: string): Promise<string> => {
    const response = await fetch(`${ENDPOINTS.DOWNLOAD}/${audioId}`);
    if (!response.ok) throw new Error('Audio download failed');
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  deleteCustomVoice: async (username: string, voiceId: string): Promise<void> => {
    const response = await fetch(`${ENDPOINTS.USER_VOICES}/${username}/${voiceId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Delete failed');
  }
};