import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';

// 水印配置接口
interface WatermarkConfig {
  enabled: boolean;
  text: string;
  positionMode: 'preset' | 'custom';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; // 预设模式
  customPosition: { x: number; y: number }; // 自定义模式，百分比位置
  opacity: number; // 0-100
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
}

interface SettingsState {
  // 用户偏好设置
  theme: 'dark' | 'light';
  language: 'zh-CN' | 'en-US';
  
  // 编辑器设置
  autoSave: boolean;
  autoSaveInterval: number; // 秒
  showWaveform: boolean;
  snapToGrid: boolean;
  
  // 快捷键设置
  customShortcuts: Record<string, string>;
  enableShortcuts: boolean;
  
  // 视频设置
  defaultVolume: number;
  defaultPlaybackRate: number;
  previewQuality: 'low' | 'medium' | 'high';
  
  // 字幕设置
  defaultFontSize: number;
  defaultFontFamily: string;
  defaultTextColor: string;
  defaultBackgroundColor: string;
  
  // 导出设置
  exportFormat: 'srt' | 'vtt' | 'ass';
  exportEncoding: 'utf-8' | 'gbk';
  
  // 界面设置
  leftPanelDefaultWidth: number;
  timelineHeight: number;
  showGridLines: boolean;
  showTimeCodes: boolean;
  
  // 水印设置
  watermark: WatermarkConfig;
}

interface SettingsStore extends SettingsState {
  // 基础设置操作
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  resetToDefaults: () => void;
  
  // 水印专用操作
  updateWatermark: (config: Partial<WatermarkConfig>) => void;
  toggleWatermark: () => void;
  switchToCustomPosition: () => void;
  
  // 快捷键管理
  setCustomShortcut: (action: string, shortcut: string) => void;
  removeCustomShortcut: (action: string) => void;
  resetShortcuts: () => void;
  
  // 导入导出设置
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
  
  // 预设管理
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;
  getPresets: () => string[];
}

const defaultSettings: SettingsState = {
  // 用户偏好
  theme: 'dark',
  language: 'zh-CN',
  
  // 编辑器设置
  autoSave: true,
  autoSaveInterval: 30,
  showWaveform: true,
  snapToGrid: true,
  
  // 快捷键设置
  customShortcuts: {},
  enableShortcuts: true,
  
  // 视频设置
  defaultVolume: 80,
  defaultPlaybackRate: 1,
  previewQuality: 'medium',
  
  // 字幕设置
  defaultFontSize: 24,
  defaultFontFamily: 'Alibaba PuHuiTi, PingFang SC, Microsoft YaHei, sans-serif',
  defaultTextColor: '#ffffff',
  defaultBackgroundColor: 'rgba(0, 0, 0, 0.6)',
  
  // 导出设置
  exportFormat: 'srt',
  exportEncoding: 'utf-8',
  
  // 界面设置
  leftPanelDefaultWidth: 400,
  timelineHeight: 180,
  showGridLines: true,
  showTimeCodes: true,
  
  // 水印设置
  watermark: {
    enabled: false, // 默认关闭
    text: 'Subtitle Studio',
    positionMode: 'preset', // 默认使用预设位置
    position: 'top-right',
    customPosition: { x: 85, y: 10 }, // 自定义位置默认值（右上角附近）
    opacity: 80,
    fontSize: 14,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
};

export const useSettingsStore = create<SettingsStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...defaultSettings,
      
      // 基础设置操作
      updateSetting: (key, value) => 
        set((state) => {
          (state as any)[key] = value;
          // 在实际应用中，这里应该持久化到 localStorage
          try {
            localStorage.setItem('subtitle-studio-settings', JSON.stringify(get()));
          } catch (error) {
            console.warn('Failed to save settings:', error);
          }
        }),
      
      resetToDefaults: () => 
        set(() => ({ ...defaultSettings })),
      
      // 水印专用操作
      updateWatermark: (config) => 
        set((state) => {
          Object.assign(state.watermark, config);
          // 持久化设置
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
              'top-right': { x: 85, y: 5 },
              'bottom-left': { x: 5, y: 85 },
              'bottom-right': { x: 85, y: 85 },
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
      
      // 快捷键管理
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
      
      // 导入导出设置
      exportSettings: () => {
        return JSON.stringify(get(), null, 2);
      },
      
      importSettings: (settingsJson) => {
        try {
          const settings = JSON.parse(settingsJson);
          // 验证设置格式
          if (typeof settings === 'object' && settings !== null) {
            set(() => ({ ...defaultSettings, ...settings }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
      
      // 预设管理 (简化版本)
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
      
      getPresets: () => {
        const presets = JSON.parse(localStorage.getItem('subtitle-studio-presets') || '{}');
        return Object.keys(presets);
      },
    }))
  )
);

// 导出水印配置类型供其他组件使用
export type { WatermarkConfig };

// 初始化时从 localStorage 加载设置
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

// 在模块加载时执行
if (typeof window !== 'undefined') {
  loadSettingsFromStorage();
}