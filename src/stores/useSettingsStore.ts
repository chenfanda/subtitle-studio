import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { WatermarkConfig, SettingsState,MaskConfig } from '../types/settings';

interface SettingsStore extends SettingsState {
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  resetToDefaults: () => void;
  
  updateWatermark: (config: Partial<WatermarkConfig>) => void;
  toggleWatermark: () => void;
  switchToCustomPosition: () => void;
  updateMask: (config: Partial<MaskConfig>) => void;
  
  setCustomShortcut: (action: string, shortcut: string) => void;
  removeCustomShortcut: (action: string) => void;
  resetShortcuts: () => void;
  
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
  
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;
  getPresets: () => string[];
}

const defaultSettings: SettingsState = {
  theme: 'dark',
  language: 'zh-CN',
  
  autoSave: true,
  autoSaveInterval: 30,
  showWaveform: true,
  snapToGrid: true,
  
  customShortcuts: {},
  enableShortcuts: true,
  
  defaultVolume: 80,
  defaultPlaybackRate: 1,
  previewQuality: 'medium',
  
  defaultFontSize: 24,
  defaultFontFamily: 'Alibaba PuHuiTi, PingFang SC, Microsoft YaHei, sans-serif',
  defaultTextColor: '#ffffff',
  defaultBackgroundColor: 'rgba(0, 0, 0, 0.6)',
  
  exportFormat: 'srt',
  exportEncoding: 'utf-8',
  
  leftPanelDefaultWidth: 400,
  timelineHeight: 180,
  showGridLines: true,
  showTimeCodes: true,
  
  watermark: {
      enabled: false,
      text: 'Subtitle Studio',
      positionMode: 'preset',
      position: 'top-right',
      customPosition: { x: 95, y: 5 },  // 同时修正为 95, 5（对应右上角边缘对齐）
      opacity: 80,
      fontSize: 14,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: 400,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      layout: 'row',  // 添加默认布局
    },

    mask: {
    enabled: false,       
    x: 10,                
    y: 85,                
    width: 80,            
    height: 10,           
    mode: 'blur',        
    intensity: 10,        
  },

};

export const useSettingsStore = create<SettingsStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...defaultSettings,
      
      updateSetting: (key, value) => 
        set((state) => {
          (state as any)[key] = value;
          try {
            localStorage.setItem('subtitle-studio-settings', JSON.stringify(get()));
          } catch (error) {
            console.warn('Failed to save settings:', error);
          }
        }),
      
      resetToDefaults: () => 
        set(() => ({ ...defaultSettings })),
      
      updateWatermark: (config) => 
        set((state) => {
          Object.assign(state.watermark, config);
          try {
            localStorage.setItem('subtitle-studio-settings', JSON.stringify(get()));
          } catch (error) {
            console.warn('Failed to save watermark settings:', error);
          }
          
        }),
      
      toggleWatermark: () => 
        set((state) => {
          state.watermark.enabled = !state.watermark.enabled;
          try {
            localStorage.setItem('subtitle-studio-settings', JSON.stringify(get()));
          } catch (error) {
            console.warn('Failed to save watermark settings:', error);
          }
          
        }),
      
      switchToCustomPosition: () => 
        set((state) => {
          if (state.watermark.positionMode === 'preset') {
            const presetToCoords = {
              'top-left': { x: 5, y: 5 },
              'top-right': { x: 95, y: 5 },
              'bottom-left': { x: 5, y: 95 },
              'bottom-right': { x: 95, y: 95 },
            };
            state.watermark.customPosition = presetToCoords[state.watermark.position];
            state.watermark.positionMode = 'custom';
            try {
              localStorage.setItem('subtitle-studio-settings', JSON.stringify(get()));
            } catch (error) {
              console.warn('Failed to save watermark settings:', error);
            }
            
          }
        }),
      
      setCustomShortcut: (action, shortcut) => 
        set((state) => {
          state.customShortcuts[action] = shortcut;
        }),
      
      removeCustomShortcut: (action) => 
        set((state) => {
          delete state.customShortcuts[action];
        }),
      
      resetShortcuts: () => 
        set((state) => {
          state.customShortcuts = {};
        }),
      
      exportSettings: () => {
        return JSON.stringify(get(), null, 2);
      },
      
      importSettings: (settingsJson) => {
        try {
          const settings = JSON.parse(settingsJson);
          if (typeof settings === 'object' && settings !== null) {
            set(() => ({ ...defaultSettings, ...settings }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
      
      savePreset: (name) => {
        const settings = get();
        const presets = JSON.parse(localStorage.getItem('subtitle-studio-presets') || '{}');
        presets[name] = settings;
        localStorage.setItem('subtitle-studio-presets', JSON.stringify(presets));
      },
      
      loadPreset: (name) => {
        const presets = JSON.parse(localStorage.getItem('subtitle-studio-presets') || '{}');
        if (presets[name]) {
          set(() => ({ ...presets[name] }));
        }
      },
      
      deletePreset: (name) => {
        const presets = JSON.parse(localStorage.getItem('subtitle-studio-presets') || '{}');
        delete presets[name];
        localStorage.setItem('subtitle-studio-presets', JSON.stringify(presets));
      },

       updateMask: (config) => 
        set((state) => {
          
          Object.assign(state.mask, config);
          
          
          try {
            localStorage.setItem('subtitle-studio-settings', JSON.stringify(get()));
          } catch (error) {
            console.warn('Failed to save mask settings:', error);
          }
        }),
      
      getPresets: () => {
        const presets = JSON.parse(localStorage.getItem('subtitle-studio-presets') || '{}');
        return Object.keys(presets);
      },
    }))
  )
);

const loadSettingsFromStorage = () => {
  try {
    const saved = localStorage.getItem('subtitle-studio-settings');
    if (saved) {
      const settings = JSON.parse(saved);
      useSettingsStore.setState({ ...defaultSettings, ...settings });
    }
  } catch (error) {
    console.warn('Failed to load settings from storage:', error);
  }
};

if (typeof window !== 'undefined') {
  loadSettingsFromStorage();
}