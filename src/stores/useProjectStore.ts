import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ProjectState } from '@/types/project';
import type { SubtitleItem, SubtitlePosition } from '@/types/subtitle';
import { DEFAULT_SUBTITLE_POSITION } from '@/types/subtitle';
import { APP_CONFIG } from '@/constants/config';

export type AppStage = 'upload' | 'processing' | 'editing';

interface ProjectStore extends ProjectState {
  appStage: AppStage;
  setAppStage: (stage: AppStage) => void;
  
  subtitles: SubtitleItem[];
  
  setVideoUrl: (url: string) => void;
  setDuration: (duration: number) => void;
  updateProjectTitle: (title: string) => void;
  
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlayback: () => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  
  addSubtitle: (subtitle: Omit<SubtitleItem, 'id'>) => void;
  updateSubtitle: (id: string, updates: Partial<SubtitleItem>) => void;
  deleteSubtitle: (id: string) => void;
  deleteSubtitles: (ids: string[]) => void;
  splitSubtitle: (id: string, splitTime: number) => void;
  mergeSubtitles: (ids: string[]) => void;
  duplicateSubtitle: (id: string) => void;
  updateSubtitles: (subtitles: SubtitleItem[]) => void;
  
  updateSubtitlePosition: (id: string, x: number, y: number) => void;
  getSubtitlePosition: (id: string) => SubtitlePosition;
  
  moveSubtitles: (ids: string[], deltaTime: number) => void;
  adjustSubtitleTiming: (id: string, startTime: number, endTime: number) => void;
  
  markUnsaved: () => void;
  markSaved: () => void;
  setSaveStatus: (status: ProjectState['saveStatus']) => void;
  
  findSubtitleAtTime: (time: number) => SubtitleItem | null;
  getNextSubtitle: (currentId: string) => SubtitleItem | null;
  getPrevSubtitle: (currentId: string) => SubtitleItem | null;
  
  validateSubtitle: (subtitle: Partial<SubtitleItem>) => string[];
  
  resetProject: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const initialState: ProjectState = {
  id: generateId(),
  title: 'Untitled Project',
  videoUrl: '',
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  volume: APP_CONFIG.DEFAULT_VOLUME,
  playbackRate: APP_CONFIG.DEFAULT_PLAYBACK_RATE,
  lastSaved: null,
  saveStatus: 'saved',
};

export const useProjectStore = create<ProjectStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,
      subtitles: [],
      appStage: 'upload' as AppStage,
      
      setAppStage: (stage) => 
        set((state) => {
          state.appStage = stage;
        }),
      
      setVideoUrl: (url) => 
        set((state) => {
          state.videoUrl = url;
          state.saveStatus = 'unsaved';
          if (url) {
            state.appStage = 'processing';
          }
        }),
      
      setDuration: (duration) => 
        set((state) => {
          state.duration = duration;
        }),
      
      updateProjectTitle: (title) => 
        set((state) => {
          state.title = title;
          state.saveStatus = 'unsaved';
        }),
      
      setCurrentTime: (time) => 
        set((state) => {
          state.currentTime = Math.max(0, Math.min(time, state.duration));
        }),
      
      setIsPlaying: (isPlaying) => 
        set((state) => {
          state.isPlaying = isPlaying;
        }),
      
      togglePlayback: () => 
        set((state) => {
          state.isPlaying = !state.isPlaying;
        }),
      
      setVolume: (volume) => 
        set((state) => {
          state.volume = Math.max(0, Math.min(100, volume));
        }),
      
      setPlaybackRate: (rate) => 
        set((state) => {
          state.playbackRate = rate;
        }),
      
      addSubtitle: (subtitleData) => 
        set((state) => {
          const subtitle: SubtitleItem = {
            ...subtitleData,
            id: generateId(),
            position: subtitleData.position || { ...DEFAULT_SUBTITLE_POSITION },
          };
          
          const insertIndex = state.subtitles.findIndex(
            s => s.startTime > subtitle.startTime
          );
          
          if (insertIndex === -1) {
            state.subtitles.push(subtitle);
          } else {
            state.subtitles.splice(insertIndex, 0, subtitle);
          }
          
          state.saveStatus = 'unsaved';
        }),
      
      updateSubtitle: (id, updates) => 
        set((state) => {
          const index = state.subtitles.findIndex(s => s.id === id);
          if (index !== -1) {
            Object.assign(state.subtitles[index], updates);
            state.saveStatus = 'unsaved';
          }
        }),
      
      deleteSubtitle: (id) => 
        set((state) => {
          state.subtitles = state.subtitles.filter(s => s.id !== id);
          state.saveStatus = 'unsaved';
        }),
      
      deleteSubtitles: (ids) => 
        set((state) => {
          state.subtitles = state.subtitles.filter(s => !ids.includes(s.id));
          state.saveStatus = 'unsaved';
        }),
      
      splitSubtitle: (id, splitTime) => 
        set((state) => {
          const index = state.subtitles.findIndex(s => s.id === id);
          if (index === -1) return;
          
          const original = state.subtitles[index];
          if (splitTime <= original.startTime || splitTime >= original.endTime) return;
          
          const secondPart: SubtitleItem = {
            ...original,
            id: generateId(),
            startTime: splitTime,
            text: original.text,
          };
          
          state.subtitles[index].endTime = splitTime;
          state.subtitles.splice(index + 1, 0, secondPart);
          state.saveStatus = 'unsaved';
        }),
      
      mergeSubtitles: (ids) => 
        set((state) => {
          if (ids.length < 2) return;
          
          const subtitlesToMerge = state.subtitles
            .filter(s => ids.includes(s.id))
            .sort((a, b) => a.startTime - b.startTime);
          
          if (subtitlesToMerge.length < 2) return;
          
          const merged: SubtitleItem = {
            ...subtitlesToMerge[0],
            endTime: subtitlesToMerge[subtitlesToMerge.length - 1].endTime,
            text: subtitlesToMerge.map(s => s.text).join(' '),
          };
          
          state.subtitles = state.subtitles.filter(s => !ids.includes(s.id));
          
          const insertIndex = state.subtitles.findIndex(
            s => s.startTime > merged.startTime
          );
          
          if (insertIndex === -1) {
            state.subtitles.push(merged);
          } else {
            state.subtitles.splice(insertIndex, 0, merged);
          }
          
          state.saveStatus = 'unsaved';
        }),
      
      duplicateSubtitle: (id) => 
        set((state) => {
          const original = state.subtitles.find(s => s.id === id);
          if (!original) return;
          
          const duplicate: SubtitleItem = {
            ...original,
            id: generateId(),
            startTime: original.endTime + 100,
            endTime: original.endTime + 100 + (original.endTime - original.startTime),
          };
          
          const insertIndex = state.subtitles.findIndex(
            s => s.startTime > duplicate.startTime
          );
          
          if (insertIndex === -1) {
            state.subtitles.push(duplicate);
          } else {
            state.subtitles.splice(insertIndex, 0, duplicate);
          }
          
          state.saveStatus = 'unsaved';
        }),
      
      updateSubtitles: (subtitles) => 
        set((state) => {
          state.subtitles = subtitles.sort((a, b) => a.startTime - b.startTime);
          state.saveStatus = 'unsaved';
        }),
      
      updateSubtitlePosition: (id, x, y) =>
        set((state) => {
          const subtitle = state.subtitles.find(s => s.id === id);
          if (subtitle) {
            if (!subtitle.position) {
              subtitle.position = { ...DEFAULT_SUBTITLE_POSITION };
            }
            subtitle.position.x = x;
            subtitle.position.y = y;
            state.saveStatus = 'unsaved';
          }
        }),
      
      getSubtitlePosition: (id) => {
        const subtitle = get().subtitles.find(s => s.id === id);
        return subtitle?.position || { ...DEFAULT_SUBTITLE_POSITION };
      },
      
      moveSubtitles: (ids, deltaTime) => 
        set((state) => {
          state.subtitles.forEach(subtitle => {
            if (ids.includes(subtitle.id)) {
              subtitle.startTime = Math.max(0, subtitle.startTime + deltaTime);
              subtitle.endTime = Math.max(subtitle.startTime + 500, subtitle.endTime + deltaTime);
            }
          });
          
          state.subtitles.sort((a, b) => a.startTime - b.startTime);
          state.saveStatus = 'unsaved';
        }),
      
      adjustSubtitleTiming: (id, startTime, endTime) => 
        set((state) => {
          const index = state.subtitles.findIndex(s => s.id === id);
          if (index !== -1) {
            state.subtitles[index].startTime = Math.max(0, startTime);
            state.subtitles[index].endTime = Math.max(startTime + APP_CONFIG.MIN_SUBTITLE_DURATION, endTime);
            
            state.subtitles.sort((a, b) => a.startTime - b.startTime);
            state.saveStatus = 'unsaved';
          }
        }),
      
      markUnsaved: () => 
        set((state) => {
          state.saveStatus = 'unsaved';
        }),
      
      markSaved: () => 
        set((state) => {
          state.saveStatus = 'saved';
          state.lastSaved = new Date();
        }),
      
      setSaveStatus: (status) => 
        set((state) => {
          state.saveStatus = status;
        }),
      
      findSubtitleAtTime: (time) => {
        const { subtitles } = get();
        return subtitles.find(
          s => time >= s.startTime && time <= s.endTime
        ) || null;
      },
      
      getNextSubtitle: (currentId) => {
        const { subtitles } = get();
        const currentIndex = subtitles.findIndex(s => s.id === currentId);
        return currentIndex !== -1 && currentIndex < subtitles.length - 1 
          ? subtitles[currentIndex + 1] 
          : null;
      },
      
      getPrevSubtitle: (currentId) => {
        const { subtitles } = get();
        const currentIndex = subtitles.findIndex(s => s.id === currentId);
        return currentIndex > 0 ? subtitles[currentIndex - 1] : null;
      },
      
      validateSubtitle: (subtitle) => {
        const errors: string[] = [];
        
        if (!subtitle.text?.trim()) {
          errors.push('字幕内容不能为空');
        }
        
        if (subtitle.text && subtitle.text.length > APP_CONFIG.MAX_SUBTITLE_LENGTH) {
          errors.push(`字幕长度不能超过 ${APP_CONFIG.MAX_SUBTITLE_LENGTH} 字符`);
        }
        
        if (subtitle.startTime !== undefined && subtitle.endTime !== undefined) {
          if (subtitle.endTime <= subtitle.startTime) {
            errors.push('结束时间必须大于开始时间');
          }
          
          const duration = subtitle.endTime - subtitle.startTime;
          if (duration < APP_CONFIG.MIN_SUBTITLE_DURATION) {
            errors.push(`字幕时长不能少于 ${APP_CONFIG.MIN_SUBTITLE_DURATION}ms`);
          }
          
          if (duration > APP_CONFIG.MAX_SUBTITLE_DURATION) {
            errors.push(`字幕时长不能超过 ${APP_CONFIG.MAX_SUBTITLE_DURATION}ms`);
          }
        }
        
        return errors;
      },
      
      resetProject: () => 
        set(() => ({
          ...initialState,
          id: generateId(),
          subtitles: [],
          appStage: 'upload' as AppStage,
        })),
    }))
  )
);

export const useAppStage = () => 
  useProjectStore((state) => state.appStage);