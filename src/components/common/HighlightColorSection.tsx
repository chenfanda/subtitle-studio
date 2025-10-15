import { useState } from 'react';

interface HighlightColorSectionProps {
  color?: string;
  onChange: (color: string | undefined) => void;
}

const PRESET_COLORS = [
  '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF',
  '#FFA500', '#FF69B4', '#98FB98', '#DDA0DD'
];

export function HighlightColorSection({ color, onChange }: HighlightColorSectionProps) {
  const [enabled, setEnabled] = useState(!!color);
  
  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      onChange(undefined);
    } else {
      onChange(color || '#FFFF00');
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">高亮色</h3>
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
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map(presetColor => (
              <button
                key={presetColor}
                onClick={() => onChange(presetColor)}
                className={`h-10 rounded-lg border-2 transition-all ${
                  color === presetColor
                    ? 'border-accent-purple scale-110'
                    : 'border-border-secondary hover:border-border-primary'
                }`}
                style={{ backgroundColor: presetColor }}
                title={presetColor}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color || '#FFFF00'}
              onChange={(e) => onChange(e.target.value)}
              className="w-12 h-10 rounded cursor-pointer border border-border-secondary"
            />
            <input
              type="text"
              value={color || '#FFFF00'}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-lg text-sm text-text-primary font-mono"
              placeholder="#FFFF00"
            />
          </div>
          
          <p className="text-xs text-text-secondary">
            为文字添加背景高亮效果
          </p>
        </>
      )}
    </div>
  );
}