import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AudioCategory, AudioTrack, AudioState } from '@/types/audio';
import { AUDIO_LIBRARY } from '@/constants/audioCategories';

interface AudioStore extends AudioState {
  // 状态
  activeCategory: AudioCategory;
  selectedTrack: AudioTrack | null;
  backgroundMusic: AudioTrack | null;
  uploadedTracks: AudioTrack[];
  
  // 方法
  setActiveCategory: (category: AudioCategory) => void;
  selectTrack: (track: AudioTrack) => void;
  clearSelection: () => void;
  
  // 播放控制
  playAudio: (track: AudioTrack) => void;
  pauseAudio: () => void;
  stopAudio: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  
  // 背景音乐管理
  setBackgroundMusic: (track: AudioTrack) => void;
  removeBackgroundMusic: () => void;
  adjustBackgroundVolume: (volume: number) => void;
  
  // 音频库管理
  getTracksByCategory: (category: AudioCategory) => AudioTrack[];
  uploadAudio: (file: File) => Promise<void>;
  deleteUploadedTrack: (trackId: string) => void;
}

export const useAudioStore = create<AudioStore>()(
  immer((set, get) => ({
    // 初始状态
    activeCategory: 'like',
    selectedTrack: null,
    backgroundMusic: null,
    uploadedTracks: [],
    
    // AudioState 字段
    isPlaying: false,
    currentTrack: null,
    volume: 80,
    currentTime: 0,
    
    // 切换音频分类
    setActiveCategory: (category) => 
      set((state) => {
        state.activeCategory = category;
        state.selectedTrack = null; // 切换分类时清除选择
      }),
    
    // 选择音频
    selectTrack: (track) => 
      set((state) => {
        state.selectedTrack = track;
      }),
    
    // 清除选择
    clearSelection: () => 
      set((state) => {
        state.selectedTrack = null;
      }),
    
    // 播放音频
    playAudio: (track) => 
      set((state) => {
        state.currentTrack = track;
        state.isPlaying = true;
        state.currentTime = 0;
        state.volume = track.volume * 100; // 转换为百分比
      }),
    
    // 暂停音频
    pauseAudio: () => 
      set((state) => {
        state.isPlaying = false;
      }),
    
    // 停止音频
    stopAudio: () => 
      set((state) => {
        state.isPlaying = false;
        state.currentTrack = null;
        state.currentTime = 0;
      }),
    
    // 设置音量
    setVolume: (volume) => 
      set((state) => {
        state.volume = Math.max(0, Math.min(100, volume));
      }),
    
    // 设置播放时间
    setCurrentTime: (time) => 
      set((state) => {
        if (state.currentTrack) {
          state.currentTime = Math.max(0, Math.min(time, state.currentTrack.duration));
        }
      }),
    
    // 设置背景音乐
    setBackgroundMusic: (track) => 
      set((state) => {
        state.backgroundMusic = {
          ...track,
          volume: track.volume // 保持原始音量设置
        };
        
        // 通知项目Store更新背景音乐
        // 这里使用默认存储方式，可以扩展ProjectState添加backgroundMusic字段
        // useProjectStore.getState().setBackgroundMusic?.(track);
      }),
    
    // 移除背景音乐
    removeBackgroundMusic: () => 
      set((state) => {
        state.backgroundMusic = null;
        // useProjectStore.getState().setBackgroundMusic?.(null);
      }),
    
    // 调整背景音乐音量
    adjustBackgroundVolume: (volume) => 
      set((state) => {
        if (state.backgroundMusic) {
          state.backgroundMusic.volume = Math.max(0, Math.min(1, volume));
        }
      }),
    
    // 获取指定分类的音频列表
    getTracksByCategory: (category) => {
      const libraryTracks = AUDIO_LIBRARY[category] || [];
      const { uploadedTracks } = get();
      
      // 合并音频库和用户上传的音频
      const userTracksInCategory = uploadedTracks.filter(track => track.category === category);
      return [...libraryTracks, ...userTracksInCategory];
    },
    
    // 上传音频
    uploadAudio: async (file) => {
      try {
        // 创建音频对象获取元数据
        const audio = new Audio();
        const url = URL.createObjectURL(file);
        
        return new Promise((resolve, reject) => {
          audio.onloadedmetadata = () => {
            const newTrack: AudioTrack = {
              id: `uploaded_${Date.now()}`,
              name: file.name.replace(/\.[^/.]+$/, ""), // 移除文件扩展名
              category: get().activeCategory, // 使用当前分类
              url,
              duration: Math.floor(audio.duration),
              volume: 0.7, // 默认音量
              fadeIn: 1,
              fadeOut: 1
            };
            
            set((state) => {
              state.uploadedTracks.push(newTrack);
              state.selectedTrack = newTrack; // 自动选择新上传的音频
            });
            
            URL.revokeObjectURL(url);
            resolve();
          };
          
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load audio file'));
          };
          
          audio.src = url;
        });
      } catch (error) {
        console.error('Audio upload failed:', error);
        throw error;
      }
    },
    
    // 删除上传的音频
    deleteUploadedTrack: (trackId) => 
      set((state) => {
        state.uploadedTracks = state.uploadedTracks.filter(track => track.id !== trackId);
        
        // 如果删除的是当前选中的音频，清除选择
        if (state.selectedTrack?.id === trackId) {
          state.selectedTrack = null;
        }
        
        // 如果删除的是背景音乐，移除背景音乐
        if (state.backgroundMusic?.id === trackId) {
          state.backgroundMusic = null;
        }
        
        // 如果删除的是正在播放的音频，停止播放
        if (state.currentTrack?.id === trackId) {
          state.isPlaying = false;
          state.currentTrack = null;
          state.currentTime = 0;
        }
      }),
  }))
);

// 便捷选择器
export const useActiveCategory = () => 
  useAudioStore((state) => state.activeCategory);

export const useSelectedTrack = () => 
  useAudioStore((state) => state.selectedTrack);

export const useBackgroundMusic = () => 
  useAudioStore((state) => state.backgroundMusic);

export const useAudioPlayState = () => 
  useAudioStore((state) => ({
    isPlaying: state.isPlaying,
    currentTrack: state.currentTrack,
    volume: state.volume,
    currentTime: state.currentTime
  }));

export const useTracksByActiveCategory = () => {
  const activeCategory = useAudioStore((state) => state.activeCategory);
  const getTracksByCategory = useAudioStore((state) => state.getTracksByCategory);
  return getTracksByCategory(activeCategory);
};