import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { AnimationEffect } from '@/types/animation';
import { useUIStore } from './useUIStore'; 
import type { 
  SubtitleItem, 
  SubtitlePosition, 
  RichTextSegment, 
  SubtitleAudioData, 
  SubtitleSoundEffectData, // <-- 新增
  SubtitleStyle 
} from '@/types/subtitle';
import type { BrollVideoData } from '@/types/broll';
import { DEFAULT_SUBTITLE_POSITION } from '@/types/subtitle';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';
import { APP_CONFIG } from '@/constants/config';
import { 
  findById, 
  sortByTime, 
  findInsertIndex, 
  generateId,
  deepClone,
  findItemAtTime,
  removeByIds
} from '@/utils/storeUtils';
import { 
  convertRichTextToPlainText, 
  createRichTextFromPlainText,
  hasAnyAnimation,
  getSegmentAnimations
} from '@/utils/textStyleUtils';
import { useHistoryStore } from './useHistoryStore';
import { useProjectStore } from './useProjectStore';

interface SubtitleStore {
  subtitles: SubtitleItem[];

  addSubtitle: (subtitle: Omit<SubtitleItem, 'id'>) => void;
  updateSubtitle: (id: string, updates: Partial<SubtitleItem>) => void;
  updateSubtitleRichText: (id: string, richText: RichTextSegment[]) => void;
  deleteSubtitle: (id: string) => void;
  deleteSubtitles: (ids: string[]) => void;
  splitSubtitle: (id: string, splitTime: number) => void;
  mergeSubtitles: (ids: string[]) => void;
  duplicateSubtitle: (id: string) => void;
  insertBlankSubtitle: (targetId: string) => void;
  updateSubtitles: (subtitles: SubtitleItem[]) => void;

  updateSubtitlePosition: (id: string, x: number, y: number) => void;
  updateSubtitleScale: (id: string, scale: number) => void;
  updateSubtitleWidth: (id: string, width: number) => void;
  getSubtitlePosition: (id: string) => SubtitlePosition;

  clearAllAnimations: (id: string) => void;
  hasSubtitleAnimations: (id: string) => boolean;
  getSubtitleAnimations: (id: string) => any[];

  moveSubtitles: (ids: string[], deltaTime: number) => void;
  adjustSubtitleTiming: (id: string, startTime: number, endTime: number) => void;

  setSubtitleAudio: (id: string, audioData: SubtitleAudioData) => void;
  removeSubtitleAudio: (id: string) => void;
  getSubtitlesWithAudio: () => SubtitleItem[];

  
  setSubtitleSoundEffect: (id: string, sfxData: SubtitleSoundEffectData) => void;
  removeSubtitleSoundEffect: (id: string) => void;

  setSubtitleBroll: (id: string, brollData: BrollVideoData) => void;
  removeSubtitleBroll: (id: string) => void;

  applyStyleToAllSubtitles: (style: SubtitleStyle,animation?: AnimationEffect,position?: SubtitlePosition) => void;

  findSubtitleAtTime: (time: number) => SubtitleItem | null;
  getNextSubtitle: (currentId: string) => SubtitleItem | null;
  getPrevSubtitle: (currentId: string) => SubtitleItem | null;

  validateSubtitle: (subtitle: Partial<SubtitleItem>) => string[];

  restoreSubtitles: (subtitles: SubtitleItem[]) => void;
}

export const useSubtitleStore = create<SubtitleStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      subtitles: [],

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
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

     updateSubtitle: (id, updates) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;

             if (updates.richText && updates.richText.length > 1) {
                  subtitle.dynamicConfig = undefined;
                }

          if (updates.richText) {
            updates.text = convertRichTextToPlainText(updates.richText);
          } else if (updates.text && updates.text !== subtitle.text) {
            const baseStyle = subtitle.style || DEFAULT_SUBTITLE_STYLE;
            updates.richText = createRichTextFromPlainText(updates.text, baseStyle);
          }

          if (updates.style && subtitle.richText && subtitle.richText.length > 0) {
            subtitle.richText.forEach(segment => {
              if (!segment.style) {
                segment.style = { ...DEFAULT_SUBTITLE_STYLE };
              }
              Object.assign(segment.style, updates.style);
            });
          }

          Object.assign(subtitle, updates);
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

      updateSubtitleRichText: (id, richText) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;

          subtitle.richText = richText;
          subtitle.text = convertRichTextToPlainText(richText);
          if (richText.length > 1) {
            subtitle.dynamicConfig = undefined;
           }
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

      deleteSubtitle: (id) => {
        set((state) => {
          state.subtitles = state.subtitles.filter(s => s.id !== id);
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

      deleteSubtitles: (ids) => {
        useHistoryStore.getState().startBatch();

        set((state) => {
          state.subtitles = removeByIds(state.subtitles, ids);
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().endBatch();
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
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
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
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().endBatch();
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
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },
      insertBlankSubtitle: (targetId) => {
        set((state) => {
          const targetIndex = state.subtitles.findIndex(s => s.id === targetId);
          if (targetIndex === -1) return;

          const targetSubtitle = state.subtitles[targetIndex];
          const defaultDuration = 1000; // 1 second
          
          const newBlankSubtitle: SubtitleItem = {
            id: generateId(),
            startTime: targetSubtitle.endTime,
            endTime: targetSubtitle.endTime + defaultDuration,
            text: "...", // 默认为 ...
            richText: createRichTextFromPlainText("...", DEFAULT_SUBTITLE_STYLE),
            style: { ...DEFAULT_SUBTITLE_STYLE },
            position: { ...DEFAULT_SUBTITLE_POSITION },
          };

          // 将新片段插入到目标片段之后
          state.subtitles.splice(targetIndex + 1, 0, newBlankSubtitle);
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },
      updateSubtitles: (subtitles) => {
        set((state) => {
          state.subtitles = sortByTime(subtitles);
        });

        useProjectStore.getState().markUnsaved();
      },

      updateSubtitlePosition: (id, x, y) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;
          if (!subtitle.position) subtitle.position = { ...DEFAULT_SUBTITLE_POSITION };

          subtitle.position.x = x;
          subtitle.position.y = y;
        });

        useProjectStore.getState().markUnsaved();
      },

      updateSubtitleScale: (id, scale) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;
          if (!subtitle.position) subtitle.position = { ...DEFAULT_SUBTITLE_POSITION };

          subtitle.position.scale = scale;
        });

        useProjectStore.getState().markUnsaved();
      },

      updateSubtitleWidth: (id, width) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;
          if (!subtitle.position) subtitle.position = { ...DEFAULT_SUBTITLE_POSITION };

          subtitle.position.width = width;
        });

        useProjectStore.getState().markUnsaved();
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
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
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
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

      adjustSubtitleTiming: (id, startTime, endTime) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;

          subtitle.startTime = Math.max(0, startTime);
          subtitle.endTime = Math.max(startTime + APP_CONFIG.MIN_SUBTITLE_DURATION, endTime);

          state.subtitles = sortByTime(state.subtitles);
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

      setSubtitleAudio: (id, audioData) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;

          subtitle.audioTrack = audioData;
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

      removeSubtitleAudio: (id) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;

          subtitle.audioTrack = undefined;
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

      getSubtitlesWithAudio: () => {
        return get().subtitles.filter(subtitle => subtitle.audioTrack);
      },

      // 3. (新增) 新的 SFX Actions 实现
      setSubtitleSoundEffect: (id, sfxData) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;

          subtitle.soundEffect = sfxData;
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

      removeSubtitleSoundEffect: (id) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;

          subtitle.soundEffect = undefined;
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

      setSubtitleBroll: (id, brollData) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;

          subtitle.brollVideo = brollData;
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

      removeSubtitleBroll: (id) => {
        set((state) => {
          const subtitle = findById(state.subtitles, id);
          if (!subtitle) return;

          subtitle.brollVideo = undefined;
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

          
    applyStyleToAllSubtitles: (style, animation, position) => {
        useHistoryStore.getState().startBatch();

        set((state) => {
          const uiState = useUIStore.getState(); 
          const activeSubtitleId = uiState.selectedSubtitleIds[0];
          
          const activeSubtitle = state.subtitles.find(s => s.id === activeSubtitleId);
          
    
          const templateIdToApply = activeSubtitle?.templateId;
          const dynamicConfigToApply = activeSubtitle?.dynamicConfig;

          state.subtitles.forEach(subtitle => {
            
            subtitle.style = { ...subtitle.style, ...style };
            if (position) {
              subtitle.position = { ...subtitle.position, ...position };
            }

            
            subtitle.templateId = templateIdToApply;

            
            subtitle.dynamicConfig = dynamicConfigToApply;

            
            if (templateIdToApply) {
              
              subtitle.richText = createRichTextFromPlainText(subtitle.text, style);
            } else if (dynamicConfigToApply) {
              subtitle.richText = createRichTextFromPlainText(subtitle.text, style);
            } else if (animation) {
              const chars = Array.from(subtitle.text);
              subtitle.richText = chars.map(char => ({
                text: char,
                style: { ...style },
                animation: { ...animation }
              }));
            } else {
              subtitle.richText = createRichTextFromPlainText(subtitle.text, style);
            }
          });
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().endBatch();
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

      restoreSubtitles: (subtitles) => {
        set((state) => {
          state.subtitles = subtitles;
        });
      },
    }))
  )
);