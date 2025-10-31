import { useState, useRef } from 'react';
import { Square, Circle } from 'lucide-react';
import { ColorPicker } from './ColorPicker';

interface BackgroundSectionProps {
  backgroundColor?: string;
  backgroundShape?: number;
  onChange: (updates: { 
    backgroundColor?: string; 
    backgroundShape?: number;
  }) => void;
}

export function BackgroundSection({ 
  backgroundColor, 
  backgroundShape = 0,
  onChange 
}: BackgroundSectionProps) {
  const enabled = !!backgroundColor && backgroundColor !== 'transparent';
  const color = backgroundColor && backgroundColor !== 'transparent' ? backgroundColor : '#000000';
  const [showPicker, setShowPicker] = useState(false);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  
  const handleToggle = (checked: boolean) => {
    if (!checked) {
      onChange({ backgroundColor: 'transparent' });
      setShowPicker(false);
    } else {
      onChange({ backgroundColor: color });
    }
  };
  
  const handleColorChange = (newColor: string) => {
    onChange({ backgroundColor: newColor });
    if (newColor === 'transparent') {
      setShowPicker(false);
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
        <h3 className="text-sm font-medium text-text-primary">背景</h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="sr-only peer"
          />
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
            <label className="text-xs text-text-secondary mb-2 block">背景形状</label>
            <div className="flex items-center gap-3">
              {/* 📍 修改点 2: 替换了 '▢' 
                * w-3.5 h-3.5 (14px) 视觉上匹配 text-xs (12px)
                */}
              <Square className="w-3.5 h-3.5 text-text-secondary" />
              <input
                type="range"
                min="0"
                max="9"
                step="3"
                value={backgroundShape}
                onChange={(e) => onChange({ backgroundShape: Number(e.target.value) })}
                className="flex-1 accent-accent-purple focus:outline-none"
              />
              {/* 📍 修改点 3: 替换了 '○' */}
              <Circle className="w-3.5 h-3.5 text-text-secondary" />
            </div>
            {/* 备注: 这里的逻辑 (50) 似乎有一个小 bug，因为滑块最大值是 9,
                但不影响图标替换。
            */}
            <div className="text-xs text-text-tertiary text-center mt-1">
              {backgroundShape === 0 ? '方形' : backgroundShape === 50 ? '椭圆' : '圆角'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}