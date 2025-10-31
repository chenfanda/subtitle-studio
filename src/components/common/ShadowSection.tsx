import { useState, useRef } from 'react';
import { ColorPicker } from './ColorPicker';
import type { SubtitleShadow } from '@/types/subtitle';

interface ShadowSectionProps {
  shadow?: SubtitleShadow;
  onChange: (shadow: SubtitleShadow) => void;
}

const SHADOW_PRESETS = {
  S: { offsetX: 1, offsetY: 1, blur: 2 },
  M: { offsetX: 1, offsetY: 1, blur: 4 }, 
  L: { offsetX: 1, offsetY: 1, blur: 8 },
};

const getActivePreset = (shadow: SubtitleShadow) => {
  if (shadow.offsetX !== 1 || shadow.offsetY !== 1) return null;
  if (shadow.blur === SHADOW_PRESETS.S.blur) return 'S';
  if (shadow.blur === SHADOW_PRESETS.M.blur) return 'M';
  if (shadow.blur === SHADOW_PRESETS.L.blur) return 'L';
  return null;
};

export function ShadowSection({ shadow, onChange }: ShadowSectionProps) {
  const enabled = shadow?.enabled || false;
  const color = shadow?.color || '#000000';
  const offsetX = shadow?.offsetX || SHADOW_PRESETS.M.offsetX;
  const offsetY = shadow?.offsetY || SHADOW_PRESETS.M.offsetY;
  const blur = shadow?.blur || SHADOW_PRESETS.M.blur;

  const [showPicker, setShowPicker] = useState(false);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  
  const handleToggle = (checked: boolean) => {
    const preset = SHADOW_PRESETS.M;
    onChange({ 
      enabled: checked, 
      color, 
      offsetX: preset.offsetX, 
      offsetY: preset.offsetY, 
      blur: preset.blur 
    });
    
    if (!checked) {
      setShowPicker(false);
    }
  };
  
  const handleColorChange = (newColor: string) => {
    if (newColor === 'transparent') {
      onChange({ enabled: false, color, offsetX, offsetY, blur });
      setShowPicker(false);
    } else {
      onChange({ enabled, color: newColor, offsetX, offsetY, blur });
    }
  };

  const handlePresetChange = (preset: 'S' | 'M' | 'L') => {
    const newValues = SHADOW_PRESETS[preset];
    onChange({
      enabled,
      color,
      offsetX: newValues.offsetX,
      offsetY: newValues.offsetY,
      blur: newValues.blur,
    });
  };

  const getPickerPosition = () => {
    if (!colorButtonRef.current) return undefined;
    const rect = colorButtonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      left: rect.left
    };
  };

  // --- 辅助样式：用于 S/M/L 按钮 ---
  // --- 修改：py-2 改为 py-1.5，使按钮更矮 ---
  const btnBaseStyle = "flex-1 py-1.5 text-sm font-medium rounded-md transition-colors";
  const btnActiveStyle = "bg-accent-purple text-white";
  const btnInactiveStyle = "bg-bg-tertiary text-text-secondary hover:bg-bg-primary";
  
  const activePreset = getActivePreset({ enabled, color, offsetX, offsetY, blur });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">阴影</h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-purple rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-purple"></div>
        </label>
      </div>
      
      {enabled && (
        <>
          <div className="flex items-center gap-2">
            <button
              ref={colorButtonRef}
              onClick={() => setShowPicker(!showPicker)}
              // --- 修改：w-10 h-10 改为 w-8 h-8，使按钮更小 ---
              className="w-8 h-8 rounded-full border-2 border-border-secondary hover:border-border-primary transition-colors cursor-pointer"
              style={{ backgroundColor: color }}
            />
          </div>

          {showPicker && (
            <ColorPicker
              value={color}
              onChange={handleColorChange}
              onClose={() => setShowPicker(false)}
              position={getPickerPosition()}
              allowTransparent={true}
            />
          )}
          
          <div>
            <label className="text-xs text-text-secondary mb-2 block">模糊</label>
            <div className="flex items-center gap-2">
              <button
                className={`${btnBaseStyle} ${activePreset === 'S' ? btnActiveStyle : btnInactiveStyle}`}
                onClick={() => handlePresetChange('S')}
              >
                S
              </button>
              <button
                className={`${btnBaseStyle} ${activePreset === 'M' ? btnActiveStyle : btnInactiveStyle}`}
                onClick={() => handlePresetChange('M')}
              >
                M
              </button>
              <button
                className={`${btnBaseStyle} ${activePreset === 'L' ? btnActiveStyle : btnInactiveStyle}`}
                onClick={() => handlePresetChange('L')}
              >
                L
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}