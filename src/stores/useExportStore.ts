import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { api } from '@/utils/api';

export type ExportStatus = 
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'processing_frontend'
  | 'processing_backend'
  | 'polling'
  | 'success'
  | 'error';

export interface ExportSettings {
  resolution: number;
  format: 'mp4' | 'gif' | 'mov' | 'avi' | 'mp3';  
  forceBackend: boolean;
}

interface ExportStore {
  showExportModal: boolean;
  exportStatus: ExportStatus;
  exportProgress: number;
  exportError: string | null;
  exportSettings: ExportSettings;
  jobId: string | null;
  downloadUrl: string | null;
  statusMessage: string;
  abortController: AbortController | null;
  startTime: number | null;
  resultBlob: Blob | null;

  setShowExportModal: (visible: boolean) => void;
  setExportStatus: (status: ExportStatus) => void;
  setExportProgress: (progress: number) => void;
  setStatusMessage: (msg: string) => void;
  setExportError: (error: string | null) => void;
  updateExportSettings: (settings: Partial<ExportSettings>) => void;
  setJobId: (jobId: string) => void;
  setDownloadUrl: (url: string) => void;
  setResultBlob: (blob: Blob | null) => void;
  
  initExport: () => AbortController;
  cancelExport: () => void;
  
  monitorJob: () => Promise<void>;
  resetExport: () => void;
}

const initialState = {
  showExportModal: false,
  exportStatus: 'idle' as ExportStatus,
  exportProgress: 0,
  statusMessage: '',
  exportError: null,
  exportSettings: {
    resolution: 1080,
    format: 'mp4' as const,
    forceBackend: false,
  },
  jobId: null,
  downloadUrl: null,
  abortController: null,
  startTime: null,
  resultBlob: null,
};

export const useExportStore = create<ExportStore>()(
  immer((set, get) => ({
    ...initialState,

    setShowExportModal: (visible) => {
      set((state) => {
        state.showExportModal = visible;

      });
    },

    setExportStatus: (status) => {
      set((state) => {
        state.exportStatus = status;
      });
    },

    setExportProgress: (progress) => {
      set((state) => {
        state.exportProgress = progress;
      });
    },

    setStatusMessage: (msg) => {
      set((state) => {
        state.statusMessage = msg;
      });
    },

    setExportError: (error) => {
      set((state) => {
        state.exportStatus = 'error';
        state.exportError = error;
        state.abortController = null;
      });
    },

    updateExportSettings: (settings) => {
      set((state) => {
        state.exportSettings = { ...state.exportSettings, ...settings };
      });
    },

    setJobId: (jobId) => {
      set((state) => {
        state.jobId = jobId;
      });
    },

    setDownloadUrl: (url) => {
      set((state) => {
        state.downloadUrl = url;
      });
    },
    setResultBlob: (blob) => {
      set((state) => {
        state.resultBlob = blob;
      });
    },

    initExport: () => {
      const controller = new AbortController();
      set((state) => {
        state.exportStatus = 'preparing';
        state.exportProgress = 0;
        state.statusMessage = '初始化中...';
        state.exportError = null;
        state.abortController = controller;
        state.startTime = Date.now();
        state.resultBlob = null; 
        state.downloadUrl = null;
      });
      return controller;
    },

    cancelExport: () => {
      const { abortController } = get();
      if (abortController) {
        abortController.abort();
      }
      set((state) => {
        state.exportStatus = 'idle';
        state.statusMessage = '已取消';
        state.abortController = null;
        state.jobId = null;
        state.exportProgress = 0;
        state.startTime = null;
      });
    },

    resetExport: () => {
      set(() => initialState);
    },

    monitorJob: async () => {
      const { jobId } = get();
      if (!jobId) return;

      set((state) => {
        state.exportStatus = 'polling';
        state.statusMessage = '等待云端处理...';
      });

      try {
        const interval = setInterval(async () => {
          const currentState = get();
          
          // 检查是否应该停止轮询 (已取消、已完成、或出错)
          if (currentState.exportStatus !== 'polling' || !currentState.jobId) {
            clearInterval(interval);
            return;
          }

          try {
            // 传递 signal 以支持取消
            const response = await api.getJobStatus(
              currentState.jobId, 
              currentState.abortController?.signal
            );

            if (response.status === 'completed') {
              clearInterval(interval);
              set((state) => {
                state.exportStatus = 'success';
                state.exportProgress = 1;
                state.statusMessage = '渲染完成';
                const resultUrl = response.result?.url || response.result || response.url;
                state.downloadUrl = resultUrl || null;
                state.abortController = null;
              });
            } else if (response.status === 'failed') {
              clearInterval(interval);
              set((state) => {
                state.exportStatus = 'error';
                state.exportError = response.error || '后端渲染失败';
                state.abortController = null;
              });
            } else {
              // 处理进度更新 (如果后端返回了 progress 字段)
              set((state) => {
                if (typeof response.progress === 'number') {
                  // 假设后端返回 0-100
                  state.exportProgress = response.progress / 100;
                  state.statusMessage = `云端渲染中... ${Math.floor(response.progress)}%`;
                } else {
                  state.statusMessage = '云端渲染中...';
                }
              });
            }
          } catch (e) {
            // 如果是 AbortError，说明是用户取消，interval 会在下一次循环通过状态检查自动停止
            if (e instanceof Error && e.name === 'AbortError') {
                return; 
            }
            // 忽略临时网络错误，继续轮询
            console.warn('Poll warning:', e);
          }
          
        }, 3000);

      } catch (error) {
        set((state) => {
          state.exportStatus = 'error';
          state.exportError = '轮询启动失败';
        });
      }
    },

  }))
);