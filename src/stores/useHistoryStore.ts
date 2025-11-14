import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ProjectSnapshot, HistoryState } from '@/types/history';
import { useSubtitleStore } from './useSubtitleStore';
import { useTextElementStore } from './useTextElementStore';
import { useMediaStore } from './useMediaStore';
import { useBrollStore } from './useBrollStore';
import { useAudioStore } from './useAudioStore';
import { useVideoSequenceStore } from './useVideoSequenceStore';
import { useUIStore } from './useUIStore';
import { useProjectStore } from './useProjectStore';
import { useSettingsStore } from './useSettingsStore';

interface HistoryStore extends HistoryState {
  isRestoring: boolean;
  pushState: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  startBatch: () => void;
  endBatch: () => void;
  clearHistory: () => void;
  getHistoryInfo: () => {
    pastCount: number;
    futureCount: number;
    canUndo: boolean;
    canRedo: boolean;
  };
}

const MAX_HISTORY = 20;
const SNAPSHOT_MERGE_THRESHOLD = 100;

const restoreSnapshot = (snapshot: ProjectSnapshot, isRestoring: boolean) => {
  if (!isRestoring) return;
  
  
  if (snapshot.projectState) {
    const { title, volume, playbackRate } = snapshot.projectState;
    useProjectStore.getState().updateProjectTitle(title);
    useProjectStore.getState().setVolume(volume);
    useProjectStore.getState().setPlaybackRate(playbackRate);
  }
  
  if (snapshot.settingsState) {
    useSettingsStore.getState().updateWatermark(snapshot.settingsState.watermark);
  }

  useSubtitleStore.getState().restoreSubtitles(snapshot.subtitles);
  useTextElementStore.getState().restoreTextElements(snapshot.textElements);
  useMediaStore.getState().restorePlacedMedia(snapshot.placedMedia);
  useBrollStore.getState().restorePlacedBrolls(snapshot.placedBrolls);
  useAudioStore.getState().restoreBackgroundMusic(snapshot.backgroundMusic);
  useVideoSequenceStore.getState().restoreSegments(snapshot.videoSequenceSegments);
  
  if (snapshot.uiState) {
    const uiStore = useUIStore.getState();
    uiStore.setSelectedSubtitles(snapshot.uiState.selectedSubtitleIds);
    uiStore.setSelectedTextElements(snapshot.uiState.selectedTextElementIds);
    uiStore.setSelectedAttachment(snapshot.uiState.selectedAttachment);
    uiStore.setTimelineZoom(snapshot.uiState.timelineZoom);
    uiStore.setTimelineScroll(snapshot.uiState.timelineScrollLeft);
    uiStore.setActivePanel(snapshot.uiState.activePanel);
    uiStore.setActiveClipTask(snapshot.uiState.activeClipTask);
  } else {
    useUIStore.getState().clearSelectedSubtitles();
    useUIStore.getState().clearSelectedTextElements();
  }
  
  useProjectStore.getState().markUnsaved();
};

export const useHistoryStore = create<HistoryStore>()(
  immer((set, get) => ({
    past: [],
    future: [],
    maxHistory: MAX_HISTORY,
    isBatching: false,
    batchStartSnapshot: null,
    isRestoring: false,
    
    pushState: () => {
      const { isBatching, isRestoring, past, maxHistory } = get();
      if (isBatching || isRestoring) return;
      
      const snapshot = useProjectStore.getState().toSnapshot();
      
     if (past.length > 0) {
        const lastSnapshot = past[past.length - 1];
    
        if (lastSnapshot.timestamp && snapshot.timestamp) {
          const timeDiff = snapshot.timestamp - lastSnapshot.timestamp;
          
          if (timeDiff < SNAPSHOT_MERGE_THRESHOLD) {
            set((state) => {
              state.past[state.past.length - 1] = snapshot;
              state.future = []; 
            });
            return; 
          }
        }
      }

      set((state) => {
        state.past.push(snapshot);
        if (state.past.length > maxHistory) {
          state.past.shift();
        }
        state.future = [];
      });
    },
    
    undo: () => {
      const { past, future } = get();
      if (past.length === 0) return;
      
      set((state) => {
        state.isRestoring = true;
      });
      
      const currentSnapshot = useProjectStore.getState().toSnapshot();
      const previousSnapshot = past[past.length - 1];
      
      set((state) => {
        state.past.pop();
        state.future.push(currentSnapshot);
      });
      
      restoreSnapshot(previousSnapshot, true);
      
      set((state) => {
        state.isRestoring = false;
      });
    },
    
    redo: () => {
      const { past, future, maxHistory } = get();
      if (future.length === 0) return;
      
      set((state) => {
        state.isRestoring = true;
      });
      
      const currentSnapshot = useProjectStore.getState().toSnapshot();
      const nextSnapshot = future[future.length - 1];
      
      set((state) => {
        state.future.pop();
        state.past.push(currentSnapshot);
        
        if (state.past.length > maxHistory) {
          state.past.shift();
        }
      });
      
      restoreSnapshot(nextSnapshot, true);
      
      set((state) => {
        state.isRestoring = false;
      });
    },
    
    canUndo: () => {
      return get().past.length > 0;
    },
    
    canRedo: () => {
      return get().future.length > 0;
    },
    
    startBatch: () => {
      set((state) => {
        state.isBatching = true;
      });
    },
    
    endBatch: () => {
      set((state) => {
        state.isBatching = false;
        state.batchStartSnapshot = null;
      });
      get().pushState();
    },
    
    clearHistory: () => {
      set((state) => {
        state.past = [];
        state.future = [];
        state.isBatching = false;
        state.batchStartSnapshot = null;
      });
    },
    
    getHistoryInfo: () => {
      const { past, future } = get();
      return {
        pastCount: past.length,
        futureCount: future.length,
        canUndo: past.length > 0,
        canRedo: future.length > 0
      };
    },
  }))
);

export const useCanUndo = () => 
  useHistoryStore((state) => state.past.length > 0);

export const useCanRedo = () => 
  useHistoryStore((state) => state.future.length > 0);

export const useHistoryInfo = () => 
  useHistoryStore((state) => ({
    pastCount: state.past.length,
    futureCount: state.future.length,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0
  }));