import { useState, useRef } from 'react';
import { ColorPicker } from './ColorPicker';

interface HighlightColorSectionProps {
  color?: string;
  intensity?: number;
  onChange: (updates: { 
    color?: string; 
    intensity?: number;
  }) => void;
}

export function HighlightColorSection({ 
  color, 
  intensity = 15,
  onChange 
}: HighlightColorSectionProps) {
  const [enabled, setEnabled] = useState(!!color);
  const [showPicker, setShowPicker] = useState(false);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  
  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      onChange({ color: undefined, intensity: intensity });
      setShowPicker(false);
    } else {
      onChange({ 
        color: color || '#FFFF00',
        intensity: intensity
      });
    }
  };
  
  const handleColorChange = (newColor: string) => {
    if (newColor === 'transparent') {
      setEnabled(false);
      onChange({ color: undefined, intensity: intensity });
      setShowPicker(false);
    } else {
      onChange({ color: newColor, intensity: intensity });
    }
  };

  const getPickerPosition = () => {
    if (!colorButtonRef.current) return undefined;
    const rect = colorButtonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      left: rect.left
    };
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">发光</h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="sr-only peer"
          />
          {/* 📍 修改点 1: 移除开关(toggle)的紫色边框 */}
          <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-purple"></div>
        </label>
      </div>
      
      {enabled && (
        <>
          <div className="flex items-center gap-2">
            <button
              ref={colorButtonRef}
              onClick={() => setShowPicker(!showPicker)}
              className="w-10 h-10 rounded-full border-2 border-border-secondary hover:border-border-primary transition-colors cursor-pointer"
              style={{ backgroundColor: color || '#FFFF00' }}
            />
          </div>

          {showPicker && (
            <ColorPicker
              value={color || '#FFFF00'}
              onChange={handleColorChange}
              onClose={() => setShowPicker(false)}
              position={getPickerPosition()}
              allowTransparent={true}
            />
          )}
          
          <div>
            <label className="text-xs text-text-secondary mb-2 block">发光强度</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={intensity}
                onChange={(e) => onChange({ color: color, intensity: Number(e.target.value) })}
                // 📍 修改点 2: 保留紫色滑块，并添加 focus:outline-none 来移除矩形边框
                className="flex-1 accent-accent-purple focus:outline-none"
              />
              <span className="text-sm text-text-primary w-12 text-right font-mono">
                {intensity}px
              </span>
            </div>
          </div>
          
          <p className="text-xs text-text-secondary">
            为文字轮廓添加发光效果
          </p>
        </>
      )}
    </div>
  );
}