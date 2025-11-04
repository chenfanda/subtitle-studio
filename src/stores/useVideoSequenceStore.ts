import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { VideoInsertClip } from '@/types/videoSequence';
import { useHistoryStore } from './useHistoryStore';
import { useProjectStore } from './useProjectStore';
// 1. (已修正) 移除了 'sortByTime'，因为它不兼容
import { generateId, findById, removeByIds } from '@/utils/storeUtils';

interface VideoSequenceStore {
  clips: VideoInsertClip[];

  /**
   * 添加一个新的视频插入片段。
   * @returns 返回新创建片段的 ID。
   */
  addClip: (clipData: Omit<VideoInsertClip, 'id'>) => string;
  
  /**
   * 按 ID 删除一个视频插入片段。
   */
  removeClip: (id: string) => void;
  
  /**
   * 批量删除多个视频插入片段 (支持撤销)。
   */
  removeClips: (ids: string[]) => void;
  
  /**
   * 更新一个视频插入片段的属性 (例如时间、时长或源 URL)。
   */
  updateClip: (id: string, updates: Partial<VideoInsertClip>) => void;
  
  /**
   * 移动一个片段到新的插入时间。
   */
  moveClip: (id: string, newInsertAtTime: number) => void;

  /**
   * (供 useHistoryStore 使用) 恢复 clips 数组的快照。
   */
  restoreClips: (clips: VideoInsertClip[]) => void;
}

export const useVideoSequenceStore = create<VideoSequenceStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      clips: [],

      addClip: (clipData) => {
        const newClip: VideoInsertClip = {
          ...clipData,
          id: generateId(),
        };

        set((state) => {
          state.clips.push(newClip);
          
          state.clips.sort((a, b) => a.insertAtTime - b.insertAtTime);
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
        
        return newClip.id;
      },

      removeClip: (id) => {
        set((state) => {
          state.clips = state.clips.filter(c => c.id !== id);
       
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },
      
      removeClips: (ids) => {
        useHistoryStore.getState().startBatch();

        set((state) => {
          state.clips = removeByIds(state.clips, ids);
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().endBatch();
      },

      updateClip: (id, updates) => {
        let needsSort = false;
        
        set((state) => {
          const clip = findById(state.clips, id);
          if (clip) {
            Object.assign(clip, updates);
            if (updates.insertAtTime !== undefined) {
              needsSort = true;
            }
          }
          
          if (needsSort) {
         
            state.clips.sort((a, b) => a.insertAtTime - b.insertAtTime);
          }
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },
      
      moveClip: (id, newInsertAtTime) => {
        set((state) => {
          const clip = findById(state.clips, id);
          if (clip) {
            clip.insertAtTime = Math.max(0, newInsertAtTime);
          
            state.clips.sort((a, b) => a.insertAtTime - b.insertAtTime);
          }
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

      restoreClips: (clips) => {
        set((state) => {
          state.clips = clips;
        });
      },
    }))
  )
);