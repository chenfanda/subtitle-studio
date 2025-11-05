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
  
  addInsertSegment: (sourceUrl: string, videoDuration: number, insertAtTime: number) => string;
  
  addCutMarker: (startTime: number, endTime: number) => void;

  removeSegment: (id: string) => void;
  
  updateSegment: (id: string, updates: Partial<TimelineSegment>) => void;
  
  restoreSegments: (segments: TimelineSegment[]) => void;
}

const recomputeGlobalStartTimes = (segments: TimelineSegment[]): TimelineSegment[] => {
  let timeCursor = 0;
  return segments.map(segment => {
    const updatedSegment = { ...segment, globalStartTime: timeCursor };
    timeCursor += segment.duration;
    return updatedSegment;
  });
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

      addInsertSegment: (sourceUrl, videoDuration, insertAtTime) => {
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
                sourceStartTime: 0,
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
          state.segments = recomputeGlobalStartTimes(newSegments);
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
              newSegments.push(segment);
              timeCursor += segment.duration;
              continue;
            }

            if (effectiveStartTime > segmentStartTime) {
              const firstPartDuration = effectiveStartTime - segmentStartTime;
              newSegments.push({
                ...segment,
                id: generateId(),
                duration: firstPartDuration,
                globalStartTime: 0,
              });
            }
            
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
          state.segments = recomputeGlobalStartTimes(newSegments);
        });
        
        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

      removeSegment: (id) => {
        set((state) => {
          const newSegments = state.segments.filter(s => s.id !== id);
          state.segments = recomputeGlobalStartTimes(newSegments);
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
              state.segments = recomputeGlobalStartTimes(state.segments);
            }
          }
        });

        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },

      restoreSegments: (segments) => {
        set((state) => {
          state.segments = segments;
        });
      },
    }))
  )
);
export const useCalculatedDuration = () => {
  const segments = useVideoSequenceStore((state) => state.segments);

  if (!segments || segments.length === 0) {
    return 0;
  }

  const lastSegment = segments[segments.length - 1];
  const totalDuration = lastSegment.globalStartTime + lastSegment.duration;

  return totalDuration / 1000;
};