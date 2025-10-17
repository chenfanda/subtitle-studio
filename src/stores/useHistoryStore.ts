import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ProjectSnapshot, HistoryState } from '@/types/history';
import { useProjectStore } from './useProjectStore';

interface HistoryStore extends HistoryState {
  pushState: () => void;
  undo: (currentSnapshot: ProjectSnapshot) => ProjectSnapshot | null;
  redo: (currentSnapshot: ProjectSnapshot) => ProjectSnapshot | null;
  
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

const MAX_HISTORY = 50;

export const useHistoryStore = create<HistoryStore>()(
  immer((set, get) => ({
    past: [],
    future: [],
    maxHistory: MAX_HISTORY,
    isBatching: false,
    batchStartSnapshot: null,
    
    pushState: () => {
      const { isBatching, past, maxHistory } = get();
      
      if (isBatching) return;
      
      const snapshot = useProjectStore.getState().toSnapshot();
      
      set((state) => {
        state.past.push(snapshot);
        
        if (state.past.length > maxHistory) {
          state.past.shift();
        }
        
        state.future = [];
      });
    },
    
    undo: (currentSnapshot) => {
      const { past } = get();
      
      if (past.length === 0) {
        return null;
      }
      
      let undoSnapshot: ProjectSnapshot | null = null;
      
      set((state) => {
        const lastSnapshot = state.past.pop();
        
        if (lastSnapshot) {
          state.future.push(currentSnapshot);
          undoSnapshot = lastSnapshot;
        }
      });
      
      return undoSnapshot;
    },
    
    redo: (currentSnapshot) => {
      const { future } = get();
      
      if (future.length === 0) {
        return null;
      }
      
      let redoSnapshot: ProjectSnapshot | null = null;
      
      set((state) => {
        const nextSnapshot = state.future.pop();
        
        if (nextSnapshot) {
          state.past.push(currentSnapshot);
          redoSnapshot = nextSnapshot;
        }
      });
      
      return redoSnapshot;
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