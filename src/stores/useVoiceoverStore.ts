import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AudioTrack } from '@/types/audio';
import type { SubtitleItem } from '@/types/subtitle';
import { useSubtitleStore } from './useSubtitleStore';

export type VoiceoverDialogView = 'source' | 'edit';
export type VoiceoverSourceView = 'tts' | 'library' | 'upload';

interface VoiceoverStore {
  dialogView: VoiceoverDialogView;
  sourceView: VoiceoverSourceView;
  selectedAudio: AudioTrack | null;
  isGenerating: boolean;

  setDialogView: (view: VoiceoverDialogView) => void;
  setSourceView: (view: VoiceoverSourceView) => void;
  selectAudio: (audio: AudioTrack) => void;

  generateTTS: (subtitle: SubtitleItem) => Promise<void>;
  uploadVoiceover: (file: File) => Promise<void>;

  applyToSubtitle: (subtitleId: string) => void;
  resetDialog: () => void;
}

export const useVoiceoverStore = create<VoiceoverStore>()(
  immer((set, get) => ({
    dialogView: 'source',
    sourceView: 'tts',
    selectedAudio: null,
    isGenerating: false,

    setDialogView: (view) =>
      set((state) => {
        state.dialogView = view;
      }),

    setSourceView: (view) =>
      set((state) => {
        state.sourceView = view;
      }),

    selectAudio: (audio) =>
      set((state) => {
        state.selectedAudio = audio;
        state.dialogView = 'edit';
      }),

    generateTTS: async (subtitle) => {
      set((state) => { 
        state.isGenerating = true; 
        state.selectedAudio = null;
      });

      console.log('Generating TTS for:', subtitle.text);
      // TODO: (此处替换为您的真实 TTS API 调用)
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      // (这是模拟的 TTS API 返回结果)
      const mockAudioTrack: AudioTrack = {
        id: `tts_${Date.now()}`,
        name: `TTS - ${subtitle.text.slice(0, 10)}...`,
        category: 'custom', 
        url: '/audio/like/crimson-dawn.mp3', // (应替换为真实的 TTS 音频 URL)
        duration: 3, 
        volume: 0.9,
        fadeIn: 0,
        fadeOut: 0,
      };

      set((state) => {
        state.selectedAudio = mockAudioTrack;
        state.dialogView = 'edit';
        state.isGenerating = false;
      });
    },

    uploadVoiceover: async (file) => {
      set((state) => { state.isGenerating = true; });

      // (此处可复用 useAudioStore 的上传逻辑)
      const audio = new Audio();
      const url = URL.createObjectURL(file);

      return new Promise((resolve, reject) => {
        audio.onloadedmetadata = () => {
          const newTrack: AudioTrack = {
            id: `vo_upload_${Date.now()}`,
            name: file.name.replace(/\.[^/.]+$/, ""),
            category: 'custom',
            url,
            duration: Math.floor(audio.duration),
            volume: 0.9,
            fadeIn: 0,
            fadeOut: 0,
          };

          set((state) => {
            state.selectedAudio = newTrack;
            state.dialogView = 'edit';
            state.isGenerating = false;
          });
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          set((state) => { state.isGenerating = false; });
          reject(new Error('Failed to load audio file'));
        };
        audio.src = url;
      });
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

    resetDialog: () =>
      set((state) => {
        state.dialogView = 'source';
        state.sourceView = 'tts';
        state.selectedAudio = null;
        state.isGenerating = false;
      }),
  }))
);