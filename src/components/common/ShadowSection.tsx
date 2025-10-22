import { useState, useRef } from 'react';
import { ColorPicker } from './ColorPicker';
import type { SubtitleShadow } from '@/types/subtitle';

interface ShadowSectionProps {
  shadow?: SubtitleShadow;
  onChange: (shadow: SubtitleShadow) => void;
}

export function ShadowSection({ shadow, onChange }: ShadowSectionProps) {
  const enabled = shadow?.enabled || false;
  const color = shadow?.color || '#000000';
  const offsetX = shadow?.offsetX || 2;
  const offsetY = shadow?.offsetY || 2;
  const blur = shadow?.blur || 4;
  const [showPicker, setShowPicker] = useState(false);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  
  const handleToggle = (checked: boolean) => {
    onChange({ enabled: checked, color, offsetX, offsetY, blur });
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
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary mb-2 block">X偏移</label>
              <input
                type="number"
                min="-20"
                max="20"
                value={offsetX}
                onChange={(e) => onChange({ enabled, color, offsetX: Number(e.target.value), offsetY, blur })}
                className="w-full px-2 py-1.5 bg-bg-tertiary border border-border-secondary rounded text-sm text-text-primary"
              />
            </div>
            
            <div>
              <label className="text-xs text-text-secondary mb-2 block">Y偏移</label>
              <input
                type="number"
                min="-20"
                max="20"
                value={offsetY}
                onChange={(e) => onChange({ enabled, color, offsetX, offsetY: Number(e.target.value), blur })}
                className="w-full px-2 py-1.5 bg-bg-tertiary border border-border-secondary rounded text-sm text-text-primary"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs text-text-secondary mb-2 block">模糊半径</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={blur}
                onChange={(e) => onChange({ enabled, color, offsetX, offsetY, blur: Number(e.target.value) })}
                className="flex-1 accent-accent-purple"
              />
              <span className="text-sm text-text-primary w-12 text-right font-mono">
                {blur}px
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}