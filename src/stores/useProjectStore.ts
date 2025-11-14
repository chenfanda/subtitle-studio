import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ProjectState, ProjectExport } from '@/types/project';
import type { ProjectSnapshot } from '@/types/history';
import { APP_CONFIG } from '@/constants/config';
import { generateId } from '@/utils/storeUtils';

import { useSubtitleStore } from './useSubtitleStore';
import { useTextElementStore } from './useTextElementStore';
import { useMediaStore } from './useMediaStore';
import { useBrollStore } from './useBrollStore';
import { useAudioStore } from './useAudioStore';
import { useSettingsStore } from './useSettingsStore';
import { useVideoSequenceStore } from './useVideoSequenceStore';
import { useUIStore } from './useUIStore';

export type AppStage = 'upload' | 'processing' | 'editing';

interface ProjectStore extends ProjectState {
  appStage: AppStage;
  setAppStage: (stage: AppStage) => void;
  
  setVideoUrl: (url: string) => void;
  setDuration: (duration: number) => void;
  updateProjectTitle: (title: string) => void;
  
  setCurrentTime: (time: number) => void;
  setGlobalTime: (time: number) => void;
  setGlobalDuration: (duration: number) => void;

  setIsPlaying: (isPlaying: boolean) => void;
  togglePlayback: () => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  
  markUnsaved: () => void;
  markSaved: () => void;
  setSaveStatus: (status: ProjectState['saveStatus']) => void;
  
  toSnapshot: () => ProjectSnapshot;
  fromSnapshot: (snapshot: ProjectSnapshot) => void;
  exportProject: () => ProjectExport;
  loadProject: (project: ProjectExport) => void;
  
  resetProject: () => void;
}

const initialState: ProjectState = {
  id: generateId(),
  title: 'Untitled Project',
  videoUrl: '',
  duration: 0,
  currentTime: 0,
  globalTime: 0,
  globalDuration: 0,
  isPlaying: false,
  volume: APP_CONFIG.DEFAULT_VOLUME,
  playbackRate: APP_CONFIG.DEFAULT_PLAYBACK_RATE,
  lastSaved: null,
  saveStatus: 'saved',
};

export const useProjectStore = create<ProjectStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,
      appStage: 'upload' as AppStage,
      
      setAppStage: (stage) => {
        set((state) => {
          state.appStage = stage;
        });
      },
      
      setVideoUrl: (url) => {
        set((state) => {
          state.videoUrl = url;
          state.saveStatus = 'unsaved';
          if (url) {
            state.appStage = 'processing';
          }
        });
      },
      
      setDuration: (duration) => {
        set((state) => {
          state.duration = duration;
          state.globalDuration = duration;
        });
        const videoUrl = get().videoUrl;
        if (videoUrl && duration > 0) {
          const durationInMs = duration * 1000;
          useVideoSequenceStore.getState().setMainVideo(videoUrl, durationInMs);
        }
      },
      
      updateProjectTitle: (title) => {
        set((state) => {
          state.title = title;
          state.saveStatus = 'unsaved';
        });
        
      },
      
      setCurrentTime: (time) => {
        set((state) => {
          state.currentTime = Math.max(0, Math.min(time, state.duration));
        });
      },

      setGlobalTime: (time) => {
        set((state) => {
          state.globalTime = Math.max(0, Math.min(time, state.globalDuration));
        });
      },

      setGlobalDuration: (duration) => {
        set((state) => {
          state.globalDuration = duration;
        });
      },
      
      setIsPlaying: (isPlaying) => {
        set((state) => {
          state.isPlaying = isPlaying;
        });
      },
      
      togglePlayback: () => {
        set((state) => {
          state.isPlaying = !state.isPlaying;
        });
      },
      
      setVolume: (volume) => {
        set((state) => {
          state.volume = Math.max(0, Math.min(100, volume));
        });
        
      },
      
      setPlaybackRate: (rate) => {
        set((state) => {
          state.playbackRate = rate;
        });
      
      },
      
      markUnsaved: () => {
        set((state) => {
          state.saveStatus = 'unsaved';
        });
      },
      
      markSaved: () => {
        set((state) => {
          state.saveStatus = 'saved';
          state.lastSaved = new Date();
        });
      },
      
      setSaveStatus: (status) => {
        set((state) => {
          state.saveStatus = status;
        });
      },

      toSnapshot: () => {
        const state = get();
        const settingsStore = useSettingsStore.getState();
        const uiStore = useUIStore.getState();
        
        const subtitleStore = useSubtitleStore.getState();
        const textElementStore = useTextElementStore.getState();
        const mediaStore = useMediaStore.getState();
        const brollStore = useBrollStore.getState();
        const audioStore = useAudioStore.getState();
        const videoSequenceStore = useVideoSequenceStore.getState();
        
        return {
          projectState: {
            title: state.title,
            volume: state.volume,
            playbackRate: state.playbackRate,
          },
          settingsState: {
            watermark: settingsStore.watermark,
          },
          uiState: {
            selectedSubtitleIds: uiStore.selectedSubtitleIds,
            selectedTextElementIds: uiStore.selectedTextElementIds,
            selectedAttachment: uiStore.selectedAttachment,
            timelineZoom: uiStore.timelineZoom,
            timelineScrollLeft: uiStore.timelineScrollLeft,
            activePanel: uiStore.activePanel,
            activeClipTask: uiStore.activeClipTask,
          },
          
          subtitles: subtitleStore.subtitles,
          textElements: textElementStore.textElements,
          placedMedia: mediaStore.placedMedia,
          placedBrolls: brollStore.placedBrolls,
          backgroundMusic: audioStore.backgroundMusic,
          videoSequenceSegments: videoSequenceStore.segments,
          timestamp: Date.now()
        };
      },
      
      fromSnapshot: (snapshot) => {
        useSubtitleStore.getState().restoreSubtitles(snapshot.subtitles);
        useTextElementStore.getState().restoreTextElements(snapshot.textElements);
        useMediaStore.getState().restorePlacedMedia(snapshot.placedMedia);
        useBrollStore.getState().restorePlacedBrolls(snapshot.placedBrolls);
        useAudioStore.getState().restoreBackgroundMusic(snapshot.backgroundMusic);
        if (snapshot.videoSequenceSegments) {
          useVideoSequenceStore.getState().restoreSegments(snapshot.videoSequenceSegments);
        }
      },
      
      exportProject: () => {
        const state = get();
        const settingsStore = useSettingsStore.getState();
        const subtitleStore = useSubtitleStore.getState();
        const textElementStore = useTextElementStore.getState();
        const mediaStore = useMediaStore.getState();
        const brollStore = useBrollStore.getState();
        const audioStore = useAudioStore.getState();
        const videoSequenceStore = useVideoSequenceStore.getState();
        
        return {
          version: '1.0.0',
          metadata: {
            title: state.title,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
          },
          video: {
            url: state.videoUrl,
            duration: state.duration
          },
          content: {
            subtitles: subtitleStore.subtitles,
            textElements: textElementStore.textElements,
            placedMedia: mediaStore.placedMedia,
            placedBrolls: brollStore.placedBrolls,
            backgroundMusic: audioStore.backgroundMusic,
            videoSequenceSegments: videoSequenceStore.segments
          },
          settings: {
            watermark: settingsStore.watermark
          }
        };
      },
      
      loadProject: (project) => {
        set((state) => {
          state.title = project.metadata.title;
          state.videoUrl = project.video.url;
          state.duration = project.video.duration;
          state.globalDuration = project.video.duration;
          state.saveStatus = 'saved';
        });
        
        useSubtitleStore.getState().restoreSubtitles(project.content.subtitles);
        useTextElementStore.getState().restoreTextElements(project.content.textElements);
        useMediaStore.getState().restorePlacedMedia(project.content.placedMedia);
        useBrollStore.getState().restorePlacedBrolls(project.content.placedBrolls);
        useAudioStore.getState().restoreBackgroundMusic(project.content.backgroundMusic);
        if (project.content.videoSequenceSegments) {
          useVideoSequenceStore.getState().restoreSegments(project.content.videoSequenceSegments);
        }
        
        useSettingsStore.getState().updateWatermark(project.settings.watermark);
        
      },
      
      resetProject: () => {
        set(() => ({
          ...initialState,
          id: generateId(),
          appStage: 'upload' as AppStage,
        }));
      },
    }))
  )
);

export const useAppStage = () => 
  useProjectStore((state) => state.appStage);