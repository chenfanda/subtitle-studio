/**
 * 历史记录 Store
 * 管理 Undo/Redo 功能
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ProjectSnapshot, HistoryState } from '@/types/history';

interface HistoryStore extends HistoryState {
  // 核心方法
  pushState: (snapshot: ProjectSnapshot) => void;
  undo: () => ProjectSnapshot | null;
  redo: () => ProjectSnapshot | null;
  
  // 查询方法
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // 批量操作
  startBatch: () => void;
  endBatch: (snapshot: ProjectSnapshot) => void;
  
  // 管理方法
  clearHistory: () => void;
  getHistoryInfo: () => {
    pastCount: number;
    futureCount: number;
    canUndo: boolean;
    canRedo: boolean;
  };
}

const MAX_HISTORY = 50; // 最大历史记录数

export const useHistoryStore = create<HistoryStore>()(
  immer((set, get) => ({
    // 初始状态
    past: [],
    future: [],
    maxHistory: MAX_HISTORY,
    isBatching: false,
    batchStartSnapshot: null,
    
    /**
     * 记录新状态
     * @param snapshot 当前项目快照
     */
    pushState: (snapshot) => {
      const { isBatching, past, maxHistory } = get();
      
      // 批量操作时不记录
      if (isBatching) return;
      
      set((state) => {
        // 添加到历史栈
        state.past.push(snapshot);
        
        // 超过上限，移除最早的记录
        if (state.past.length > maxHistory) {
          state.past.shift();
        }
        
        // 清空重做栈（新操作后无法重做）
        state.future = [];
      });
    },
    
    /**
     * 撤销操作
     * @returns 撤销后的快照，null 表示无法撤销
     */
    undo: () => {
      const { past } = get();
      
      if (past.length === 0) {
        return null;
      }
      
      let undoSnapshot: ProjectSnapshot | null = null;
      
      set((state) => {
        // 从历史栈弹出最后一个状态
        const lastSnapshot = state.past.pop();
        
        if (lastSnapshot) {
          // 当前状态需要保存到重做栈
          // 但这里不保存，由外部（useProjectStore）调用时传入当前状态
          
          // 返回要恢复的快照
          undoSnapshot = lastSnapshot;
        }
      });
      
      return undoSnapshot;
    },
    
    /**
     * 重做操作
     * @returns 重做后的快照，null 表示无法重做
     */
    redo: () => {
      const { future } = get();
      
      if (future.length === 0) {
        return null;
      }
      
      let redoSnapshot: ProjectSnapshot | null = null;
      
      set((state) => {
        // 从重做栈弹出最后一个状态
        const nextSnapshot = state.future.pop();
        
        if (nextSnapshot) {
          redoSnapshot = nextSnapshot;
        }
      });
      
      return redoSnapshot;
    },
    
    /**
     * 检查是否可以撤销
     */
    canUndo: () => {
      return get().past.length > 0;
    },
    
    /**
     * 检查是否可以重做
     */
    canRedo: () => {
      return get().future.length > 0;
    },
    
    /**
     * 开始批量操作
     * 批量操作期间的所有变更会被合并为一次历史记录
     */
    startBatch: () => {
      set((state) => {
        state.isBatching = true;
      });
    },
    
    /**
     * 结束批量操作
     * @param snapshot 批量操作结束后的快照
     */
    endBatch: (snapshot) => {
      set((state) => {
        state.isBatching = false;
        state.batchStartSnapshot = null;
      });
      
      // 记录批量操作的结果
      get().pushState(snapshot);
    },
    
    /**
     * 清空所有历史记录
     * 用于加载新项目或重置
     */
    clearHistory: () => {
      set((state) => {
        state.past = [];
        state.future = [];
        state.isBatching = false;
        state.batchStartSnapshot = null;
      });
    },
    
    /**
     * 获取历史记录信息
     * 用于 UI 显示或调试
     */
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

// 便捷选择器
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