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
  format: 'mp4' | 'gif';
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

  setShowExportModal: (visible: boolean) => void;
  setExportStatus: (status: ExportStatus) => void;
  setExportProgress: (progress: number) => void;
  setExportError: (error: string | null) => void;
  updateExportSettings: (settings: Partial<ExportSettings>) => void;
  setJobId: (jobId: string) => void;
  setDownloadUrl: (url: string) => void;
  
  monitorJob: () => Promise<void>;
  resetExport: () => void;
}

const initialState = {
  showExportModal: false,
  exportStatus: 'idle' as ExportStatus,
  exportProgress: 0,
  exportError: null,
  exportSettings: {
    resolution: 1080,
    format: 'mp4' as const,
    forceBackend: false,
  },
  jobId: null,
  downloadUrl: null,
};

export const useExportStore = create<ExportStore>()(
  immer((set, get) => ({
    ...initialState,

    setShowExportModal: (visible) => {
      set((state) => {
        state.showExportModal = visible;
        if (visible) {
          state.exportStatus = 'idle';
          state.exportProgress = 0;
          state.exportError = null;
          state.jobId = null;
          state.downloadUrl = null;
        }
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

    setExportError: (error) => {
      set((state) => {
        state.exportStatus = 'error';
        state.exportError = error;
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

    resetExport: () => {
      set(() => initialState);
    },

    monitorJob: async () => {
      const { jobId } = get();
      if (!jobId) return;

      set((state) => {
        state.exportStatus = 'polling';
      });

      try {
        const interval = setInterval(async () => {
          const state = get();
          if (state.exportStatus !== 'polling' || !state.jobId) {
            clearInterval(interval);
            return;
          }

          const response = await api.getJobStatus(state.jobId);

          if (response.status === 'completed') {
            clearInterval(interval);
            set((state) => {
              state.exportStatus = 'success';
              state.downloadUrl = response.url || null;
            });
          } else if (response.status === 'failed') {
            clearInterval(interval);
            set((state) => {
              state.exportStatus = 'error';
              state.exportError = '后端渲染失败';
            });
          }
          
        }, 5000);

      } catch (error) {
        set((state) => {
          state.exportStatus = 'error';
          state.exportError = '轮询作业状态时发生网络错误';
        });
      }
    },

  }))
);