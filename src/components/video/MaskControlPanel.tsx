import React from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function MaskControlPanel() {
  const { mask, updateMask } = useSettingsStore();

  return (
    <div className="w-64 p-4 space-y-4 select-none">
      {/* 标题和开关 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">去除原始字幕</h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer"
            checked={mask.enabled}
            onChange={(e) => updateMask({ enabled: e.target.checked })}
          />
          {/* 修复：移除了 peer-focus:ring-2 等聚焦样式 */}
          <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-purple"></div>
        </label>
      </div>

      {mask.enabled && (
        <div className="space-y-4 pt-2 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
          {/* 模式选择 */}
          <div className="grid grid-cols-2 gap-2 bg-black/20 p-1 rounded-lg">
            <button
              onClick={() => updateMask({ mode: 'blur' })}
              className={`text-xs py-1.5 rounded transition-all ${
                mask.mode === 'blur' 
                  ? 'bg-accent-purple text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              高斯模糊
            </button>
            <button
              onClick={() => updateMask({ mode: 'mosaic' })}
              className={`text-xs py-1.5 rounded transition-all ${
                mask.mode === 'mosaic' 
                  ? 'bg-accent-purple text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              马赛克
            </button>
          </div>

          {/* 强度滑块 */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>强度</span>
              <span>{mask.intensity}</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={mask.intensity}
              onChange={(e) => updateMask({ intensity: Number(e.target.value) })}
              // 修复：添加 focus:outline-none 移除默认聚焦边框
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-accent-purple hover:bg-gray-500 focus:outline-none"
            />
          </div>
          
          <div className="text-[10px] text-gray-500 leading-relaxed">
            提示：开启后，可直接在视频画面上拖拽方框调整遮挡范围。
          </div>
        </div>
      )}
    </div>
  );
}