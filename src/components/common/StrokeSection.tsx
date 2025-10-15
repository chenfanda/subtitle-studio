interface StrokeSectionProps {
  stroke?: {
    enabled: boolean;
    color: string;
    width: number;
  };
  onChange: (stroke: { enabled: boolean; color: string; width: number }) => void;
}

export function StrokeSection({ stroke, onChange }: StrokeSectionProps) {
  const enabled = stroke?.enabled || false;
  const color = stroke?.color || '#000000';
  const width = stroke?.width || 2;
  
  const handleToggle = (checked: boolean) => {
    onChange({ enabled: checked, color, width });
  };
  
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
            <input
              type="color"
              value={color}
              onChange={(e) => onChange({ enabled, color: e.target.value, width })}
              className="w-12 h-10 rounded cursor-pointer border border-border-secondary"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => onChange({ enabled, color: e.target.value, width })}
              className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-lg text-sm text-text-primary font-mono"
              placeholder="#000000"
            />
          </div>
          
          <div>
            <label className="text-xs text-text-secondary mb-2 block">描边宽度</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={width}
                onChange={(e) => onChange({ enabled, color, width: Number(e.target.value) })}
                className="flex-1 accent-accent-purple"
              />
              <span className="text-sm text-text-primary w-12 text-right font-mono">
                {width}px
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}