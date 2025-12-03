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
  
  addInsertSegment: (sourceUrl: string, videoDuration: number, insertAtTime: number,sourceStartTime?: number) => string;
  
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
    timeCursor += segment.duration;
    return updatedSegment;
  });
  return { segments: updatedSegments, totalDuration: timeCursor };
};

export const useVideoSequenceStore = create<VideoSequenceStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
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

      addInsertSegment: (sourceUrl, videoDuration, insertAtTime, sourceStartTime = 0) => {
              
              const newSegmentId = generateId();
              
              set((state) => {
                const newSegments: TimelineSegment[] = [];
                let insertTimeCursor = 0;

                for (const segment of state.segments) {
                  const segmentStartTime = insertTimeCursor;
                  const segmentEndTime = segmentStartTime + segment.duration;

                  if (
                    insertAtTime > segmentStartTime &&
                    insertAtTime < segmentEndTime &&
                    segment.type === 'main'
                  ) {
                    const cutPoint = insertAtTime - segmentStartTime;
                    const firstPartDuration = cutPoint;
                    const secondPartDuration = segment.duration - cutPoint;

                    if (firstPartDuration > 0) {
                      newSegments.push({
                        ...segment,
                        id: generateId(),
                        duration: firstPartDuration,
                        globalStartTime: 0,
                      });
                    }

                    newSegments.push({
                      id: newSegmentId,
                      type: 'insert',
                      sourceUrl: sourceUrl,
                      sourceStartTime: sourceStartTime,
                      duration: videoDuration,
                      globalStartTime: 0,
                    });

                    if (secondPartDuration > 0) {
                      newSegments.push({
                        ...segment,
                        id: generateId(),
                        sourceStartTime: segment.sourceStartTime + cutPoint,
                        duration: secondPartDuration,
                        globalStartTime: 0,
                      });
                    }
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

            if (effectiveEndTime <= effectiveStartTime) {
              // 没有重叠
              newSegments.push(segment);
              timeCursor += segment.duration;
              continue;
            }

            // 1. 添加 "跳播" 前的部分
            if (effectiveStartTime > segmentStartTime) {
              const firstPartDuration = effectiveStartTime - segmentStartTime;
              newSegments.push({
                ...segment,
                id: generateId(),
                duration: firstPartDuration,
                globalStartTime: 0, 
              });
            }
            
            // 2. [核心修改] 添加 "cut" 标记片段
            const cutDuration = effectiveEndTime - effectiveStartTime;
            if (cutDuration > 0) {
              newSegments.push({
                id: generateId(), // 这个 ID 是可逆转的关键
                type: 'cut',
                sourceUrl: segment.sourceUrl, // 保存源信息以便恢复
                sourceStartTime: segment.sourceStartTime + (effectiveStartTime - segmentStartTime),
                duration: cutDuration,
                globalStartTime: 0, // recompute 会处理
              });
            }

            // 3. 添加 "跳播" 后的部分
            if (effectiveEndTime < segmentEndTime) {
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
          const segmentIndex = state.segments.findIndex(s => s.id === id);
          if (segmentIndex === -1) {
            console.warn("Segment to remove not found:", id);
            return;
          }
          
          const segmentToRemove = state.segments[segmentIndex];
          
          
          if (
            (segmentToRemove.type === 'insert' || segmentToRemove.type === 'cut') &&
            segmentIndex > 0 &&
            segmentIndex < state.segments.length - 1
          ) {
            const prevSegment = state.segments[segmentIndex - 1];
            const nextSegment = state.segments[segmentIndex + 1];

            
            if (
              prevSegment.type === 'main' &&
              nextSegment.type === 'main' &&
              prevSegment.sourceUrl === nextSegment.sourceUrl
            ) {
           
              const gapDuration = nextSegment.sourceStartTime - (prevSegment.sourceStartTime + prevSegment.duration);
              
              
              prevSegment.duration = prevSegment.duration + gapDuration + nextSegment.duration;
              
              
              state.segments.splice(segmentIndex, 2);
              
            } else {
              
              state.segments.splice(segmentIndex, 1);
            }
          } else {
            
            state.segments.splice(segmentIndex, 1);
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