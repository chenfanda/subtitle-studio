import { 
  VoiceCharacter, 
  UserCustomVoice, 
  TTSResponse, 
  TimelineDialogueRequest, 
  TimelineDialogueResponse 
} from '@/types/tts';
import { API_CLIENT } from '@/config/api-client';

const ENDPOINTS = API_CLIENT.ENDPOINTS.TTS;


function mapParamToBackendString(value: number): string {
  if (value <= 0.6) return 'very_low';
  if (value <= 0.8) return 'low';
  if (value <= 1.2) return 'moderate'; 
  if (value <= 1.6) return 'high';
  return 'very_high';
}

export interface SmartSubItem {
  id: string;
  start_time: number; 
  end_time: number;   
  text: string;       
  new_text: string;   
  speaker: string;
}

export interface SmartDubbingResponse {
  success: boolean;
  audioUrl: string;
  audioId: string;
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
    const speedStr = mapParamToBackendString(speed);
    const pitchStr = mapParamToBackendString(pitch);

    const response = await fetch(ENDPOINTS.GENERATE_CHAR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        character_id: characterId,
        speed: speedStr, 
        pitch: pitchStr 
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

  generateWithAudioPrompt: async (
      text: string,
      audioBlob: Blob,
      promptText: string = '',
      speed: number = 1.0,
      pitch: number = 1.0,
      targetDuration?: number 
    ): Promise<TTSResponse> => {
      const formData = new FormData();
      formData.append('text', text);
      if (promptText) formData.append('prompt_text', promptText);
      

      const mapVal = (v: number) => {
          if (v <= 0.6) return 'very_low';
          if (v <= 0.8) return 'low';
          if (v <= 1.2) return 'moderate';
          if (v <= 1.6) return 'high';
          return 'very_high';
      };

      formData.append('speed', mapVal(speed));
      formData.append('pitch', mapVal(pitch));
      
      if (targetDuration) {
        formData.append('target_duration', targetDuration.toString());
      }
      formData.append('prompt_audio', audioBlob, 'slice.wav');

      
      const response = await fetch(`/api/tts/tts_with_prompt`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Generation failed');
      return response.json();
    },

  generateSmartDubbing: async (
    subtitles: any[], 
    originalSubtitlesMap: Map<string, string> | null,
    audioUrl: string
  ): Promise<SmartDubbingResponse> => {
    
    
    const smartSubtitles: SmartSubItem[] = subtitles.map(sub => {

      const startTimeSec = (sub.startTime / 1000).toFixed(1);
      const endTimeSec = (sub.endTime / 1000).toFixed(1);
      const timeKey = `${startTimeSec}-${endTimeSec}`;

      const originalText = originalSubtitlesMap?.get(timeKey) || sub.text;

      return {
        id: sub.id,
        start_time: sub.startTime, 
        end_time: sub.endTime,     
        text: originalText,        
        new_text: sub.text,        
        speaker: sub.speaker || 'speaker_0'
      };
    });

    const response = await fetch('/api/smart_dubbing/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subtitles: smartSubtitles,
        audioUrl: audioUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `智能配音请求失败: ${response.status}`);
    }

    return response.json();
  },

  generateTimelineDialogue: async (
    request: TimelineDialogueRequest
  ): Promise<TimelineDialogueResponse> => {
  

  const response = await fetch(ENDPOINTS.GENERATE_TIMELINE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
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


