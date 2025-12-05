import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { TimelineSegment } from '@/types/videoSequence';
import { useHistoryStore } from './useHistoryStore';
import { useProjectStore } from './useProjectStore';
import { generateId, findById } from '@/utils/storeUtils';


interface VideoSequenceStore {
  segments: TimelineSegment[];
  
  setMainVideo: (sourceUrl: string, duration: number) => void;
  
  addInsertSegment: (sourceUrl: string, videoDuration: number, insertAtTime: number,sourceStartTime?: number, volume?: number) => string;
  
  addCutMarker: (startTime: number, endTime: number) => void;

  removeSegment: (id: string) => void;
  
  updateSegment: (id: string, updates: Partial<TimelineSegment>) => void;

  mergeAdjacentMainSegments: (firstSegmentId: string) => void;
  
  restoreSegments: (segments: TimelineSegment[]) => void;
}

const recomputeGlobalStartTimes = (segments: TimelineSegment[]): {
  segments: TimelineSegment[];
  totalDuration: number;
} => {
  let timeCursor = 0;
  const updatedSegments = segments.map(segment => {
    const updatedSegment = { ...segment, globalStartTime: timeCursor };
    if (segment.type !== 'cut') {
      timeCursor += segment.duration;
    }
    return updatedSegment;
  });
  return { segments: updatedSegments, totalDuration: timeCursor };
};

export const useVideoSequenceStore = create<VideoSequenceStore>()(
  subscribeWithSelector(
    immer((set,_get) => ({
      segments: [],

      setMainVideo: (sourceUrl, duration) => {
        set((state) => {
          state.segments = [
            {
              id: generateId(),
              type: 'main',
              sourceUrl: sourceUrl,
              sourceStartTime: 0,
              duration: duration,
              globalStartTime: 0,
            }
          ];
        });
        useHistoryStore.getState().clearHistory();
      },

   addInsertSegment: (sourceUrl, videoDuration, insertAtTime, sourceStartTime = 0, volume = 50) => {
          const newSegmentId = generateId();
          
          set((state) => {
            const newSegments: TimelineSegment[] = [];
            let insertTimeCursor = 0;
            let hasInserted = false; 

            for (const segment of state.segments) {
              const segmentStartTime = insertTimeCursor;
              const segmentEndTime = segmentStartTime + segment.duration;

              // 1. 加上 "=" 号，允许在片段的精确边缘插入
              if (
                !hasInserted &&
                insertAtTime >= segmentStartTime &&
                insertAtTime <= segmentEndTime &&
                segment.type === 'main'
              ) {
                const cutPoint = insertAtTime - segmentStartTime;
                const firstPartDuration = cutPoint;
                const secondPartDuration = segment.duration - cutPoint;

                const EPSILON = 0.00001; 

                // 添加前半部分
                if (firstPartDuration > EPSILON) {
                  newSegments.push({
                    ...segment,
                    id: generateId(),
                    duration: firstPartDuration,
                    globalStartTime: 0,
                  });
                }

                // 添加插入片段
                newSegments.push({
                  id: newSegmentId,
                  type: 'insert',
                  sourceUrl: sourceUrl,
                  sourceStartTime: sourceStartTime,
                  duration: videoDuration,
                  globalStartTime: 0,
                  volume: volume, 
                });

                if (secondPartDuration > EPSILON) {
                  newSegments.push({
                    ...segment,
                    id: generateId(),
                    sourceStartTime: segment.sourceStartTime + cutPoint,
                    duration: secondPartDuration,
                    globalStartTime: 0,
                  });
                }

                hasInserted = true;
              } else {
                newSegments.push(segment);
              }
              
              insertTimeCursor += segment.duration;
            }

            const { segments, totalDuration } = recomputeGlobalStartTimes(newSegments);
            state.segments = segments;
            useProjectStore.getState().setGlobalDuration(totalDuration / 1000);
          });

          useProjectStore.getState().markUnsaved();
          useHistoryStore.getState().pushState();
          return newSegmentId;
        },

      
      addCutMarker: (startTime, endTime) => {
        set((state) => {
          const newSegments: TimelineSegment[] = [];
          let timeCursor = 0;

          for (const segment of state.segments) {
            const segmentStartTime = timeCursor;
            const segmentEndTime = segmentStartTime + segment.duration;
            
            const effectiveStartTime = Math.max(segmentStartTime, startTime);
            const effectiveEndTime = Math.min(segmentEndTime, endTime);

            // Case 1: 没有重叠 (Cut 区间完全在当前片段之外)
            if (effectiveEndTime <= effectiveStartTime) {
              newSegments.push(segment);
              timeCursor += segment.duration;
              continue;
            }

            // Case 2: 有重叠，需要切分
            
            // 2.1 添加 "跳播" 前的部分 (保留头部)
            // 只有当时长 > 0 (比如 > 1ms) 时才添加，避免浮点数误差生成极短片段
            if (effectiveStartTime > segmentStartTime + 0.001) {
              const firstPartDuration = effectiveStartTime - segmentStartTime;
              newSegments.push({
                ...segment,
                id: generateId(),
                duration: firstPartDuration,
                globalStartTime: 0, 
              });
            }
            
            // 2.2 添加 "cut" 标记片段
            const cutDuration = effectiveEndTime - effectiveStartTime;
            if (cutDuration > 0) {
              newSegments.push({
                id: generateId(),
                type: 'cut',
                sourceUrl: segment.sourceUrl,
                sourceStartTime: segment.sourceStartTime + (effectiveStartTime - segmentStartTime),
                duration: cutDuration,
                globalStartTime: 0,
              });
            }

            // 2.3 添加 "跳播" 后的部分 (保留尾部)
            // [关键修复] 严格检查剩余时长是否显著大于 0
            if (effectiveEndTime < segmentEndTime - 0.001) {
              const secondPartDuration = segmentEndTime - effectiveEndTime;
              const secondPartSourceStartTime = segment.sourceStartTime + (effectiveEndTime - segmentStartTime);
              newSegments.push({
                ...segment,
                id: generateId(),
                sourceStartTime: secondPartSourceStartTime,
                duration: secondPartDuration,
                globalStartTime: 0,
              });
            }
            // 如果 effectiveEndTime >= segmentEndTime，说明切到了末尾，直接丢弃尾部，不生成新片段。

            timeCursor = segmentEndTime;
          }
          
          const { segments, totalDuration } = recomputeGlobalStartTimes(newSegments);
          state.segments = segments;
          useProjectStore.getState().setGlobalDuration(totalDuration / 1000);
        });
        
        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

     removeSegment: (id) => {
        set((state) => {
          const index = state.segments.findIndex(s => s.id === id);
          if (index === -1) return;
          
          const segmentToRemove = state.segments[index];
          
          if (segmentToRemove.type === 'cut') {
            const prev = state.segments[index - 1];
            const next = state.segments[index + 1];
            let mergedToPrev = false;

            if (prev && prev.sourceUrl === segmentToRemove.sourceUrl) {
              prev.duration += segmentToRemove.duration;
              mergedToPrev = true;
            }

            if (next && next.sourceUrl === segmentToRemove.sourceUrl) {
              if (mergedToPrev) {
                prev.duration += next.duration;
                state.segments.splice(index + 1, 1);
              } else {
                next.sourceStartTime -= segmentToRemove.duration;
                next.duration += segmentToRemove.duration;
              }
            }

            state.segments.splice(index, 1);
          } 
          else if (segmentToRemove.type === 'insert') {
            state.segments.splice(index, 1);

            const newPrev = state.segments[index - 1];
            const newNext = state.segments[index];

            if (
              newPrev && newNext &&
              newPrev.type === 'main' && newNext.type === 'main' &&
              newPrev.sourceUrl === newNext.sourceUrl
            ) {
              const expectedNextStartTime = newPrev.sourceStartTime + newPrev.duration;
              if (Math.abs(newNext.sourceStartTime - expectedNextStartTime) < 10) {
                 newPrev.duration += newNext.duration;
                 state.segments.splice(index, 1);
              }
            }
          }
          else {
            state.segments.splice(index, 1);
          }

          const { segments, totalDuration } = recomputeGlobalStartTimes(state.segments);
          state.segments = segments;
          useProjectStore.getState().setGlobalDuration(totalDuration / 1000);
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

      updateSegment: (id, updates) => {
        set((state) => {
          const segment = findById(state.segments, id);
          if (segment) {
            Object.assign(segment, updates);
            if (updates.duration !== undefined) {
              const { segments, totalDuration } = recomputeGlobalStartTimes(state.segments);
              state.segments = segments;
              useProjectStore.getState().setGlobalDuration(totalDuration / 1000);
            }
          }
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },
      
      mergeAdjacentMainSegments: (segmentId) => {
        set((state) => {
          const firstSegmentIndex = state.segments.findIndex(s => s.id === segmentId);
          const firstSegment = state.segments[firstSegmentIndex];

          if (!firstSegment || firstSegment.type !== 'main') {
            console.warn("Merge failed: First segment not found or is not 'main'.");
            return;
          }
          const secondSegmentIndex = firstSegmentIndex + 1;
          const secondSegment = state.segments[secondSegmentIndex];

          if (!secondSegment || secondSegment.type !== 'main') {
            console.warn("Merge failed: No adjacent 'main' segment found.");
            return;
          }
          const gapDuration = secondSegment.sourceStartTime - (firstSegment.sourceStartTime + firstSegment.duration);
          
          firstSegment.duration = firstSegment.duration + gapDuration + secondSegment.duration;

          state.segments.splice(secondSegmentIndex, 1);
          
          const { segments, totalDuration } = recomputeGlobalStartTimes(state.segments);
          state.segments = segments;
          useProjectStore.getState().setGlobalDuration(totalDuration / 1000);
        });
        
        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

      restoreSegments: (segments) => {
        set((state) => {
          const { segments: newSegments, totalDuration } = recomputeGlobalStartTimes(segments);
          state.segments = newSegments;
          useProjectStore.getState().setGlobalDuration(totalDuration / 1000);
        });
      },
    }))
  )
);

export const useCalculatedDuration = () => {
  return useProjectStore((state) => state.globalDuration);
};