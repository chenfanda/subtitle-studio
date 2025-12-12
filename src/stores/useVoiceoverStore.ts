import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AudioTrack } from '@/types/audio';
import type { SubtitleItem } from '@/types/subtitle';
import type { 
  VoiceCharacter, 
  UserCustomVoice, 
  SubtitleVoiceConfig, 
  TimelineDialogueRequest 
} from '@/types/tts';

import { useSubtitleStore } from './useSubtitleStore';
import { useUserStore } from './useUserStore';
import { useProjectStore } from './useProjectStore';

import { ttsService } from '@/utils/ttsService';
import { sliceAudioFromUrl } from '@/utils/audioSlicer';
import { API_CLIENT } from '@/config/api-client';

export type VoiceoverDialogView = 'source' | 'edit';
export type VoiceoverSourceView = 'tts' | 'library' | 'upload' | 'extraction';


function formatToTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const hStr = h.toString().padStart(2, '0');
  const mStr = m.toString().padStart(2, '0');
  const sStr = s.toFixed(3).padStart(6, '0'); // 02.500 -> 6位字符
  return `${hStr}:${mStr}:${sStr}`;
}

interface VoiceoverStore {
  dialogView: VoiceoverDialogView;
  sourceView: VoiceoverSourceView;
  selectedAudio: AudioTrack | null;
  isGenerating: boolean;
  error: string | null; // [新增] 错误状态

  systemCharacters: VoiceCharacter[];
  userVoices: UserCustomVoice[];
  
  currentConfig: {
    voiceId: string;
    type: 'system' | 'custom';
    speed: number;
    pitch: number;
  };

  batchMapping: Record<string, SubtitleVoiceConfig>;

  setDialogView: (view: VoiceoverDialogView) => void;
  setSourceView: (view: VoiceoverSourceView) => void;
  selectAudio: (audio: AudioTrack) => void;
  updateConfig: (config: Partial<VoiceoverStore['currentConfig']>) => void;
  setSpeakerMapping: (speakerName: string, config: SubtitleVoiceConfig) => void;
  clearError: () => void; // [新增] 清除错误

  loadVoices: () => Promise<void>;

  generateTTS: (subtitle: SubtitleItem) => Promise<void>;
  uploadVoiceover: (file: File) => Promise<void>;
  extractAudioFromSubtitle: (subtitle: SubtitleItem, customName?: string) => Promise<void>;
  generateBatchTTS: (subtitleIds: string[]) => Promise<void>;

  applyToSubtitle: (subtitleId: string) => void;
  resetDialog: () => void;
}

export const useVoiceoverStore = create<VoiceoverStore>()(
  immer((set, get) => ({
    dialogView: 'source',
    sourceView: 'tts',
    selectedAudio: null,
    isGenerating: false,
    error: null, // [新增] 初始化
    
    systemCharacters: [],
    userVoices: [],
    
    currentConfig: {
      voiceId: '', 
      type: 'system',
      speed: 1.0,
      pitch: 1.0
    },

    batchMapping: {},

    setDialogView: (view) => set(state => { state.dialogView = view; }),
    setSourceView: (view) => set(state => { state.sourceView = view; }),
    selectAudio: (audio) => set(state => { 
      state.selectedAudio = audio; 
      state.dialogView = 'edit'; 
    }),
    
    updateConfig: (config) => set(state => {
      state.currentConfig = { ...state.currentConfig, ...config };
    }),

    setSpeakerMapping: (speakerName, config) => set(state => {
      state.batchMapping[speakerName] = config;
    }),
    
    clearError: () => set(state => { state.error = null; }), // [新增]

    loadVoices: async () => {
      try {
        set(state => { state.error = null; }); // 清除旧错误
        const chars = await ttsService.fetchSystemCharacters();
        
        const userInfo = useUserStore.getState().userInfo;
        let customVoices: UserCustomVoice[] = [];
        if (userInfo?.id) {
          customVoices = await ttsService.fetchUserVoices(userInfo.id);
        }

        set(state => {
          state.systemCharacters = chars;
          state.userVoices = customVoices;
          
          if (!state.currentConfig.voiceId && chars.length > 0) {
            // 兼容 id 和 character_id
            state.currentConfig.voiceId = chars[0].id || (chars[0] as any).character_id;
            state.currentConfig.type = 'system';
          }
        });
      } catch (error) {
        console.error('Failed to load voices:', error);
        // 加载失败可以不提示，或者显示在 UI 上
        set(state => { state.error = "无法加载角色列表，请检查服务连接"; });
      }
    },

    generateTTS: async (subtitle) => {
      set(state => { 
        state.isGenerating = true; 
        state.selectedAudio = null;
        state.error = null; // [修改] 开始前清除错误
      });

      try {
        const { currentConfig } = get();
        const userInfo = useUserStore.getState().userInfo;

        if (!currentConfig.voiceId) throw new Error('请先选择一个角色');

        let ttsResponse;

        if (currentConfig.type === 'system') {
          ttsResponse = await ttsService.generateWithCharacter(
            subtitle.text,
            currentConfig.voiceId,
            currentConfig.speed,
            currentConfig.pitch
          );
        } else {
          if (!userInfo?.id) throw new Error('请先登录以使用自定义音色');
          
          ttsResponse = await ttsService.generateWithCustomVoice(
            subtitle.text,
            userInfo.id,
            currentConfig.voiceId,
            currentConfig.speed,
            currentConfig.pitch
          );
        }

        const audioUrl = await ttsService.downloadAudioAsBlobUrl(ttsResponse.audio_id);

        const tempAudio = new Audio(audioUrl);
        await new Promise((resolve) => {
          tempAudio.onloadedmetadata = resolve;
          tempAudio.onerror = resolve;
        });

        const newTrack: AudioTrack = {
          id: `tts_${ttsResponse.audio_id}`,
          name: `TTS: ${subtitle.text.slice(0, 10)}...`,
          category: 'custom', 
          url: audioUrl,
          duration: tempAudio.duration || 0,
          volume: 1.0,
          fadeIn: 0,
          fadeOut: 0,
        };

        set(state => {
          state.selectedAudio = newTrack;
          state.dialogView = 'edit';
        });

      } catch (error) {
        console.error('TTS Generation failed:', error);
        // [修改] 设置错误状态，不再 alert
        set(state => { 
          state.error = error instanceof Error ? error.message : '生成失败'; 
        });
      } finally {
        set(state => { state.isGenerating = false; });
      }
    },

    uploadVoiceover: async (file) => {
      set(state => { 
        state.isGenerating = true; 
        state.error = null;
      });
      try {
        const url = URL.createObjectURL(file);
        const audio = new Audio(url);
        
        await new Promise<void>((resolve, reject) => {
          audio.onloadedmetadata = () => resolve();
          audio.onerror = () => reject(new Error('Invalid audio file'));
          audio.src = url;
        });

        const newTrack: AudioTrack = {
          id: `vo_upload_${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          category: 'custom',
          url,
          duration: audio.duration,
          volume: 1.0,
          fadeIn: 0,
          fadeOut: 0,
        };

        set(state => {
          state.selectedAudio = newTrack;
          state.dialogView = 'edit';
        });

      } catch (error) {
        console.error(error);
        set(state => { 
          state.error = error instanceof Error ? error.message : '上传失败'; 
        });
      } finally {
        set(state => { state.isGenerating = false; });
      }
    },

    extractAudioFromSubtitle: async (subtitle, customName) => {
      set(state => { 
        state.isGenerating = true; 
        state.error = null; 
      });
      
      try {
        const userInfo = useUserStore.getState().userInfo;
        if (!userInfo?.id) throw new Error('请先登录');

        const projectSource = useProjectStore.getState().sourceResources;
        if (!projectSource?.audioVocals) {
          throw new Error('未找到人声轨道，请确保项目已完成人声分离处理');
        }

        const wavBlob = await sliceAudioFromUrl(
          projectSource.audioVocals,
          subtitle.startTime,
          subtitle.endTime
        );

        const voiceName = customName || `提取音色_${new Date().toLocaleTimeString()}`;
        
        await ttsService.saveCustomVoice(
          userInfo.id,
          voiceName,
          subtitle.text,
          wavBlob,
          `从字幕 "${subtitle.text.slice(0, 10)}..." 提取`
        );

        await get().loadVoices();

        const updatedVoices = get().userVoices;
        const newVoice = updatedVoices.find(v => v.voice_name === voiceName);
        
        if (newVoice) {
          set(state => {
            state.currentConfig.type = 'custom';
            state.currentConfig.voiceId = newVoice.voice_id;
            state.sourceView = 'tts';
          });
        }
        // 成功不需要 alert，或者可以用 toast，这里暂不处理成功提示

      } catch (error) {
        console.error('Extraction failed:', error);
        set(state => { 
          state.error = error instanceof Error ? error.message : '提取失败'; 
        });
      } finally {
        set(state => { state.isGenerating = false; });
      }
    },

    generateBatchTTS: async (subtitleIds) => {
      set(state => { 
        state.isGenerating = true; 
        state.error = null;
      });
      try {
        const subtitleStore = useSubtitleStore.getState();
        const { batchMapping, currentConfig } = get();
        const userInfo = useUserStore.getState().userInfo;

        const targetSubtitles = subtitleStore.subtitles.filter(s => subtitleIds.includes(s.id));
        if (targetSubtitles.length === 0) throw new Error('未选择任何字幕');

        const dialogueLines = targetSubtitles.map(sub => {
          let characterId = currentConfig.voiceId;
          let speed = currentConfig.speed;
          
          if (sub.speaker && batchMapping[sub.speaker]) {
            const mapping = batchMapping[sub.speaker];
            characterId = mapping.characterId;
            speed = mapping.speed || 1.0;
            
            if (mapping.type === 'custom') {
               if (!userInfo?.id) {
                 throw new Error(`角色 ${mapping.name} 是自定义音色，请先登录`);
               }
               // [TS修复] 强制转换为 any 以访问可能的 username 字段
               // 如果 userInfo 里真的没有 username，这里可能会是 undefined，后端会报错
               // 假设 id 就是用来鉴权的标识
               const username = (userInfo as any).username || (userInfo as any).name || 'default_user';
               
               if (!characterId.includes(':')) {
                   characterId = `${username}:${characterId}`;
               }
            }
          } else if (currentConfig.type === 'custom') {
             if (!userInfo?.id) {
                 throw new Error('当前选择的是自定义音色，请先登录');
             }
             const username = (userInfo as any).username || (userInfo as any).name || 'default_user';
             if (!characterId.includes(':')) {
                 characterId = `${username}:${characterId}`;
             }
          }

          return {
            role: sub.speaker || 'unknown', 
            text: sub.text,
            voice_id: characterId,          
            start: formatToTimestamp(sub.startTime / 1000), 
            end: formatToTimestamp(sub.endTime / 1000),     
            speed: speed
          };
        });

        // [TS修复] 强制转换为 any，绕过前端错误的类型定义
        const request = {
          dialogue_lines: dialogueLines,
          output_format: 'wav'
        } as any;
        
        // [TS修复] 强制把 response 当作 any 处理，因为 tts.ts 定义是错的
        const response = await ttsService.generateTimelineDialogue(request) as any;

        // 兼容处理：后端可能返回 audio_files (新版) 或 results (旧版)
        const resultList = response.audio_files || response.results;

        if (resultList) {
            resultList.forEach((file: any, index: number) => {
              const originalSubtitle = targetSubtitles[index];
              if (!originalSubtitle) return;

              // 尝试获取 audio_id
              let audioId = file.audio_id;
              if (!audioId && file.audio_path) {
                  const match = file.audio_path.match(/_([a-f0-9-]{36})_/);
                  audioId = match ? match[1] : `batch_${Date.now()}_${index}`;
              }

              const downloadEndpoint = API_CLIENT.ENDPOINTS.TTS.DOWNLOAD;
              const audioUrl = `${downloadEndpoint}/${audioId}`;

              const newTrack: AudioTrack = {
                id: `tts_batch_${audioId}`,
                name: `TTS: ${originalSubtitle.text.slice(0, 8)}...`,
                category: 'custom',
                url: audioUrl,
                duration: (originalSubtitle.endTime - originalSubtitle.startTime) / 1000, 
                volume: 1.0,
                fadeIn: 0,
                fadeOut: 0
              };

              subtitleStore.setSubtitleAudio(originalSubtitle.id, {
                track: newTrack,
                volume: 1.0,
                fadeIn: 0,
                fadeOut: 0
              });
            });
        }
        
      } catch (error) {
        console.error('Batch TTS failed:', error);
        set(state => { 
          state.error = error instanceof Error ? error.message : '批量生成失败'; 
        });
      } finally {
        set(state => { state.isGenerating = false; });
      }
    },

    applyToSubtitle: (subtitleId) => {
      const { selectedAudio } = get();
      if (!selectedAudio) return;

      const subtitleStore = useSubtitleStore.getState();
      
      subtitleStore.setSubtitleAudio(subtitleId, {
        track: selectedAudio,
        volume: selectedAudio.volume,
        fadeIn: selectedAudio.fadeIn,
        fadeOut: selectedAudio.fadeOut,
      });

      get().resetDialog();
    },

    resetDialog: () => set(state => {
      state.dialogView = 'source';
      state.selectedAudio = null;
      state.isGenerating = false;
      state.error = null;
    }),
  }))
);