import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ProjectState, ProjectExport } from '@/types/project';
import type { SubtitleItem, SubtitlePosition, RichTextSegment, SubtitleAudioData, SubtitleStyle } from '@/types/subtitle';
import type { TextElement } from '@/types/textElement';
import type { BrollVideoData } from '@/types/broll';
import type { ProjectSnapshot } from '@/types/history';
import { DEFAULT_SUBTITLE_POSITION } from '@/types/subtitle';
import { APP_CONFIG } from '@/constants/config';
import { 
  convertRichTextToPlainText, 
  createRichTextFromPlainText,
  hasAnyAnimation,
  getSegmentAnimations
} from '@/utils/textStyleUtils';
import { 
  findById, 
  sortByTime, 
  findInsertIndex, 
  generateId,
  deepClone,
  findItemAtTime,
  removeByIds
} from '@/utils/storeUtils';
import { useHistoryStore } from './useHistoryStore';
import { useMediaStore } from './useMediaStore';
import { useBrollStore } from './useBrollStore';
import { useAudioStore } from './useAudioStore';
import { useSettingsStore } from './useSettingsStore';

export type AppStage = 'upload' | 'processing' | 'editing';

interface ProjectStore extends ProjectState {
  appStage: AppStage;
  setAppStage: (stage: AppStage) => void;
  
  subtitles: SubtitleItem[];
  textElements: TextElement[];
  
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
  updateSubtitleRichText: (id: string, richText: RichTextSegment[]) => void;
  deleteSubtitle: (id: string) => void;
  deleteSubtitles: (ids: string[]) => void;
  splitSubtitle: (id: string, splitTime: number) => void;
  mergeSubtitles: (ids: string[]) => void;
  duplicateSubtitle: (id: string) => void;
  updateSubtitles: (subtitles: SubtitleItem[]) => void;
  
  getSubtitlePosition: (id: string) => SubtitlePosition;
  
  clearAllAnimations: (id: string) => void;
  hasSubtitleAnimations: (id: string) => boolean;
  getSubtitleAnimations: (id: string) => any[];
  
  moveSubtitles: (ids: string[], deltaTime: number) => void;
  adjustSubtitleTiming: (id: string, startTime: number, endTime: number) => void;
  
  setSubtitleAudio: (id: string, audioData: SubtitleAudioData) => void;
  removeSubtitleAudio: (id: string) => void;
  getSubtitlesWithAudio: () => SubtitleItem[];
  
  setSubtitleBroll: (id: string, brollData: BrollVideoData) => void;
  removeSubtitleBroll: (id: string) => void;
  
  addTextElement: (element: Omit<TextElement, 'id'>) => string;
  updateTextElement: (id: string, updates: Partial<TextElement>) => void;
  updateTextElementText: (id: string, text: string) => void;
  deleteTextElement: (id: string) => void;
  
  applyStyleToAllSubtitles: (style: SubtitleStyle) => void;
  applyStyleToAllTextElementsOfType: (type: string, style: SubtitleStyle) => void;
  getTextElementType: (id: string) => string;
  
  toSnapshot: () => ProjectSnapshot;
  fromSnapshot: (snapshot: ProjectSnapshot) => void;
  
  exportProject: () => ProjectExport;
  loadProject: (project: ProjectExport) => void;
  
  markUnsaved: () => void;
  markSaved: () => void;
  setSaveStatus: (status: ProjectState['saveStatus']) => void;
  
  findSubtitleAtTime: (time: number) => SubtitleItem | null;
  getNextSubtitle: (currentId: string) => SubtitleItem | null;
  getPrevSubtitle: (currentId: string) => SubtitleItem | null;
  
  validateSubtitle: (subtitle: Partial<SubtitleItem>) => string[];
  
  resetProject: () => void;
}

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
      textElements: [],
      appStage: 'upload' as AppStage,
      
      setAppStage: (stage) => {
        set((state) => {
          state.appStage = stage;
        });
      },
      
      setVideoUrl: (url) => {
        set((state) => {
          state.videoUrl = url;
          state.saveStatus = 'unsaved';
          if (url) {
            state.appStage = 'processing';
          }
        });
      },
      
      setDuration: (duration) => {
        set((state) => {
          state.duration = duration;
        });
      },
      
      updateProjectTitle: (title) => {
        set((state) => {
          state.title = title;
          state.saveStatus = 'unsaved';
        });
      },
      
      setCurrentTime: (time) => {
        set((state) => {
          state.currentTime = Math.max(0, Math.min(time, state.duration));
        });
      },
      
      setIsPlaying: (isPlaying) => {
        set((state) => {
          state.isPlaying = isPlaying;
        });
      },
      
      togglePlayback: () => {
        set((state) => {
          state.isPlaying = !state.isPlaying;
        });
      },
      
      setVolume: (volume) => {
        set((state) => {
          state.volume = Math.max(0, Math.min(100, volume));
        });
      },
      
      setPlaybackRate: (rate) => {
        set((state) => {
          state.playbackRate = rate;
        });
      },
      
      addSubtitle: (subtitleData) => {
        set((state) => {
          const subtitle: SubtitleItem = {
            ...subtitleData,
            id: generateId(),
            position: subtitleData.position || { ...DEFAULT_SUBTITLE_POSITION },
          };
          
          const insertIndex = findInsertIndex(state.subtitles, subtitle.startTime);
          
          if (insertIndex === -1) {
            state.subtitles.push(subtitle);
          } else {
            state.subtitles.splice(insertIndex, 0, subtitle);
          }
          
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
      },
      
      updateSubtitle: (id, updates) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;
          
          if (updates.richText) {
            updates.text = convertRichTextToPlainText(updates.richText);
          }
          
          Object.assign(subtitle, updates);
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
      },
      
      updateSubtitleRichText: (id, richText) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;
          
          subtitle.richText = richText;
          subtitle.text = convertRichTextToPlainText(richText);
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
      },
      
      deleteSubtitle: (id) => {
        set((state) => {
          state.subtitles = state.subtitles.filter(s => s.id !== id);
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
      },
      
      deleteSubtitles: (ids) => {
        useHistoryStore.getState().startBatch();
        
        set((state) => {
          state.subtitles = removeByIds(state.subtitles, ids);
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().endBatch(get().toSnapshot());
      },
      
      splitSubtitle: (id, splitTime) => {
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
            richText: original.richText ? deepClone(original.richText) : undefined,
          };
          
          state.subtitles[index].endTime = splitTime;
          state.subtitles.splice(index + 1, 0, secondPart);
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
      },
      
      mergeSubtitles: (ids) => {
        if (ids.length < 2) return;
        
        useHistoryStore.getState().startBatch();
        
        set((state) => {
          const subtitlesToMerge = state.subtitles
            .filter(s => ids.includes(s.id))
            .sort((a, b) => a.startTime - b.startTime);
          
          if (subtitlesToMerge.length < 2) return;
          
          const mergedText = subtitlesToMerge.map(s => s.text).join(' ');
          const mergedRichText = subtitlesToMerge.some(s => s.richText) 
            ? subtitlesToMerge.flatMap(s => s.richText || createRichTextFromPlainText(s.text, s.style))
            : undefined;
          
          const merged: SubtitleItem = {
            ...subtitlesToMerge[0],
            id: generateId(),
            endTime: subtitlesToMerge[subtitlesToMerge.length - 1].endTime,
            text: mergedText,
            richText: mergedRichText,
          };
          
          state.subtitles = removeByIds(state.subtitles, ids);
          
          const insertIndex = findInsertIndex(state.subtitles, merged.startTime);
          
          if (insertIndex === -1) {
            state.subtitles.push(merged);
          } else {
            state.subtitles.splice(insertIndex, 0, merged);
          }
          
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().endBatch(get().toSnapshot());
      },
      
      duplicateSubtitle: (id) => {
        set((state) => {
          const original = findById(state.subtitles, id);
          if (!original) return;
          
          const duplicate: SubtitleItem = {
            ...original,
            id: generateId(),
            startTime: original.endTime + 100,
            endTime: original.endTime + 100 + (original.endTime - original.startTime),
            richText: original.richText ? deepClone(original.richText) : undefined,
          };
          
          const insertIndex = findInsertIndex(state.subtitles, duplicate.startTime);
          
          if (insertIndex === -1) {
            state.subtitles.push(duplicate);
          } else {
            state.subtitles.splice(insertIndex, 0, duplicate);
          }
          
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
      },
      
      updateSubtitles: (subtitles) => {
        set((state) => {
          state.subtitles = sortByTime(subtitles);
          state.saveStatus = 'unsaved';
        });
      },
      
      getSubtitlePosition: (id) => {
        const subtitle = findById(get().subtitles, id);
        return subtitle?.position || { ...DEFAULT_SUBTITLE_POSITION };
      },
      
      clearAllAnimations: (id) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle?.richText) return;
          
          subtitle.richText.forEach(segment => {
            segment.animation = undefined;
          });
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
      },
      
      hasSubtitleAnimations: (id) => {
        const subtitle = findById(get().subtitles, id);
        return subtitle?.richText ? hasAnyAnimation(subtitle.richText) : false;
      },
      
      getSubtitleAnimations: (id) => {
        const subtitle = findById(get().subtitles, id);
        return subtitle?.richText ? getSegmentAnimations(subtitle.richText) : [];
      },
      
      moveSubtitles: (ids, deltaTime) => {
        set((state) => {
          state.subtitles.forEach(subtitle => {
            if (ids.includes(subtitle.id)) {
              subtitle.startTime = Math.max(0, subtitle.startTime + deltaTime);
              subtitle.endTime = Math.max(subtitle.startTime + 500, subtitle.endTime + deltaTime);
            }
          });
          
          state.subtitles = sortByTime(state.subtitles);
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
      },
      
      adjustSubtitleTiming: (id, startTime, endTime) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;
          
          subtitle.startTime = Math.max(0, startTime);
          subtitle.endTime = Math.max(startTime + APP_CONFIG.MIN_SUBTITLE_DURATION, endTime);
          
          state.subtitles = sortByTime(state.subtitles);
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
      },
      
      setSubtitleAudio: (id, audioData) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;
          
          subtitle.audioTrack = audioData;
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
      },
      
      removeSubtitleAudio: (id) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;
          
          subtitle.audioTrack = undefined;
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
      },
      
      getSubtitlesWithAudio: () => {
        return get().subtitles.filter(subtitle => subtitle.audioTrack);
      },
      
      setSubtitleBroll: (id, brollData) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;
          
          subtitle.brollVideo = brollData;
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
      },
      
      removeSubtitleBroll: (id) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;
          
          subtitle.brollVideo = undefined;
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
      },
      
      addTextElement: (element) => {
        const id = generateId();
        
        set((state) => {
          state.textElements.push({ ...element, id });
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
        
        return id;
      },
      
      updateTextElement: (id, updates) => {
        set((state) => {
          const element = findById(state.textElements, id);
          if (!element) return;
          
          Object.assign(element, updates);
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
      },
      
      updateTextElementText: (id, text) => {
        set((state) => {
          const element = findById(state.textElements, id);
          if (!element) return;
          
          element.text = text;
          
          if (element.richText && element.richText.length > 0) {
            element.richText[0].text = text;
          }
          
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
      },
      
      deleteTextElement: (id) => {
        set((state) => {
          state.textElements = state.textElements.filter(e => e.id !== id);
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().pushState(get().toSnapshot());
      },
      
      applyStyleToAllSubtitles: (style) => {
        useHistoryStore.getState().startBatch();
        
        set((state) => {
          state.subtitles.forEach(subtitle => {
            subtitle.style = { ...subtitle.style, ...style };
            
            if (subtitle.richText) {
              subtitle.richText = subtitle.richText.map(segment => ({
                ...segment,
                style: { ...segment.style, ...style }
              }));
            }
          });
          
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().endBatch(get().toSnapshot());
      },
      
      applyStyleToAllTextElementsOfType: (type, style) => {
        useHistoryStore.getState().startBatch();
        
        set((state) => {
          state.textElements.forEach(element => {
            if (element.type === type) {
              element.style = { ...element.style, ...style };
              
              if (element.richText) {
                element.richText = element.richText.map(segment => ({
                  ...segment,
                  style: { ...segment.style, ...style }
                }));
              }
            }
          });
          
          state.saveStatus = 'unsaved';
        });
        
        useHistoryStore.getState().endBatch(get().toSnapshot());
      },
      
      getTextElementType: (id) => {
        const element = findById(get().textElements, id);
        return element?.type || 'unknown';
      },
      
      toSnapshot: () => {
        const state = get();
        const mediaStore = useMediaStore.getState();
        const brollStore = useBrollStore.getState();
        const audioStore = useAudioStore.getState();
        
        return {
          subtitles: deepClone(state.subtitles),
          textElements: deepClone(state.textElements),
          placedMedia: deepClone(mediaStore.placedMedia),
          placedBrolls: deepClone(brollStore.placedBrolls),
          backgroundMusic: deepClone(audioStore.backgroundMusic),
          timestamp: Date.now()
        };
      },
      
      fromSnapshot: (snapshot) => {
        set((state) => {
          state.subtitles = snapshot.subtitles;
          state.textElements = snapshot.textElements;
        });
        
        useMediaStore.getState().restorePlacedMedia(snapshot.placedMedia);
        useBrollStore.getState().restorePlacedBrolls(snapshot.placedBrolls);
        useAudioStore.getState().restoreBackgroundMusic(snapshot.backgroundMusic);
      },
      
      exportProject: () => {
        const state = get();
        const settingsStore = useSettingsStore.getState();
        const mediaStore = useMediaStore.getState();
        const brollStore = useBrollStore.getState();
        const audioStore = useAudioStore.getState();
        
        return {
          version: '1.0.0',
          metadata: {
            title: state.title,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
          },
          video: {
            url: state.videoUrl,
            duration: state.duration
          },
          content: {
            subtitles: state.subtitles,
            textElements: state.textElements,
            placedMedia: mediaStore.placedMedia,
            placedBrolls: brollStore.placedBrolls,
            backgroundMusic: audioStore.backgroundMusic
          },
          settings: {
            watermark: settingsStore.watermark
          }
        };
      },
      
      loadProject: (project) => {
        set((state) => {
          state.title = project.metadata.title;
          state.videoUrl = project.video.url;
          state.duration = project.video.duration;
          state.subtitles = project.content.subtitles;
          state.textElements = project.content.textElements;
          state.saveStatus = 'saved';
        });
        
        useMediaStore.getState().restorePlacedMedia(project.content.placedMedia);
        useBrollStore.getState().restorePlacedBrolls(project.content.placedBrolls);
        useAudioStore.getState().restoreBackgroundMusic(project.content.backgroundMusic);
        useSettingsStore.getState().updateWatermark(project.settings.watermark);
        
        useHistoryStore.getState().clearHistory();
      },
      
      markUnsaved: () => {
        set((state) => {
          state.saveStatus = 'unsaved';
        });
      },
      
      markSaved: () => {
        set((state) => {
          state.saveStatus = 'saved';
          state.lastSaved = new Date();
        });
      },
      
      setSaveStatus: (status) => {
        set((state) => {
          state.saveStatus = status;
        });
      },
      
      findSubtitleAtTime: (time) => {
        return findItemAtTime(get().subtitles, time);
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
        
        const textToCheck = subtitle.richText 
          ? convertRichTextToPlainText(subtitle.richText)
          : subtitle.text;
        
        if (!textToCheck?.trim()) {
          errors.push('字幕内容不能为空');
        }
        
        if (textToCheck && textToCheck.length > APP_CONFIG.MAX_SUBTITLE_LENGTH) {
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
      
      resetProject: () => {
        set(() => ({
          ...initialState,
          id: generateId(),
          subtitles: [],
          textElements: [],
          appStage: 'upload' as AppStage,
        }));
      },
    }))
  )
);

export const useAppStage = () => 
  useProjectStore((state) => state.appStage);