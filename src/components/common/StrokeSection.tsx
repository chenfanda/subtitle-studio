import { useState, useRef } from 'react';
import { ColorPicker } from './ColorPicker';

interface StrokeSectionProps {
  stroke?: {
    enabled: boolean;
    color: string;
    width: number;
  };
  onChange: (stroke: { enabled: boolean; color: string; width: number }) => void;
}

const STROKE_PRESETS = {
  S: 0.1,
  M: 0.2,
  L: 0.3,
};

export function StrokeSection({ stroke, onChange }: StrokeSectionProps) {
  const enabled = stroke?.enabled || false;
  const color = stroke?.color || '#000000';
  const width = stroke?.width || STROKE_PRESETS.M;
  
  const [showPicker, setShowPicker] = useState(false);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  
  const handleToggle = (checked: boolean) => {
    onChange({ enabled: checked, color, width });
    if (!checked) {
      setShowPicker(false);
    }
  };
  
  const handleColorChange = (newColor: string) => {
    if (newColor === 'transparent') {
      onChange({ enabled: false, color, width });
      setShowPicker(false);
    } else {
      onChange({ enabled, color: newColor, width });
    }
  };

  const handleWidthChange = (newWidth: number) => {
    onChange({ enabled, color, width: newWidth });
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">描边</h3>
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
            <label className="text-xs text-text-secondary mb-2 block">描边宽度</label>
            <div className="flex items-center gap-2">
              <button
                className={`${btnBaseStyle} ${width === STROKE_PRESETS.S ? btnActiveStyle : btnInactiveStyle}`}
                onClick={() => handleWidthChange(STROKE_PRESETS.S)}
              >
                S
              </button>
              <button
                className={`${btnBaseStyle} ${width === STROKE_PRESETS.M ? btnActiveStyle : btnInactiveStyle}`}
                onClick={() => handleWidthChange(STROKE_PRESETS.M)}
              >
                M
              </button>
              <button
                className={`${btnBaseStyle} ${width === STROKE_PRESETS.L ? btnActiveStyle : btnInactiveStyle}`}
                onClick={() => handleWidthChange(STROKE_PRESETS.L)}
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