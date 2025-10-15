import type { SubtitleStyle } from '@/types/subtitle';

interface BasicEffectsSectionProps {
  targetType: 'subtitle' | 'textElement';
  style: SubtitleStyle;
  onChange: (updates: Partial<SubtitleStyle>) => void;
}

const FONT_OPTIONS = [
  { value: 'Montserrat Extra', label: 'Montserrat Extra' },
  { value: 'PingFang SC', label: 'PingFang SC' },
  { value: 'Microsoft YaHei', label: 'Microsoft YaHei' },
  { value: 'Arial', label: 'Arial' },
  { value: 'sans-serif', label: 'Sans Serif' }
];

export function BasicEffectsSection({ targetType, style, onChange }: BasicEffectsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-text-primary">基本效果</h3>
      
      {/* 文字字体 */}
      <div>
        <label className="text-xs text-text-secondary mb-2 block">文字字体</label>
        <select
          value={style.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className="w-full px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-lg text-sm text-text-primary focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
        >
          {FONT_OPTIONS.map(font => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* 🆕 文字间距（仅字幕显示） */}
      {targetType === 'subtitle' && (
        <div>
          <label className="text-xs text-text-secondary mb-2 block">文字间距</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="-2"
              max="10"
              step="0.5"
              value={style.letterSpacing || 0}
              onChange={(e) => onChange({ letterSpacing: Number(e.target.value) })}
              className="flex-1 accent-accent-purple"
            />
            <span className="text-sm text-text-primary w-16 text-right font-mono">
              {(style.letterSpacing || 0).toFixed(1)}px
            </span>
          </div>
        </div>
      )}
      
      {/* 字体大小 */}
      <div>
        <label className="text-xs text-text-secondary mb-2 block">字体大小</label>
        <input
          type="number"
          min="12"
          max="72"
          value={style.fontSize}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          className="w-full px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-lg text-sm text-text-primary focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
        />
      </div>
      
      {/* 填充色 */}
      <div>
        <label className="text-xs text-text-secondary mb-2 block">填充</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={style.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="w-12 h-10 rounded cursor-pointer border border-border-secondary"
          />
          <input
            type="text"
            value={style.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-lg text-sm text-text-primary font-mono"
            placeholder="#FFFFFF"
          />
        </div>
      </div>
      
      {/* 文字格式 B/I/U/S */}
      <div>
        <label className="text-xs text-text-secondary mb-2 block">格式</label>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => onChange({ fontWeight: style.fontWeight >= 600 ? 400 : 700 })}
            className={`h-10 rounded-lg border transition-all ${
              style.fontWeight >= 600
                ? 'bg-accent-purple border-accent-purple text-white shadow-lg shadow-accent-purple/20'
                : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
            }`}
            title="粗体"
          >
            <strong>B</strong>
          </button>
          
          <button
            onClick={() => onChange({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' })}
            className={`h-10 rounded-lg border transition-all ${
              style.fontStyle === 'italic'
                ? 'bg-accent-purple border-accent-purple text-white shadow-lg shadow-accent-purple/20'
                : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
            }`}
            title="斜体"
          >
            <em>I</em>
          </button>
          
          <button
            onClick={() => {
              const current = style.textDecoration || '';
              const hasUnderline = current.includes('underline');
              const hasStrike = current.includes('line-through');
              
              let newDecoration = '';
              if (!hasUnderline) {
                newDecoration = hasStrike ? 'underline line-through' : 'underline';
              } else if (hasStrike) {
                newDecoration = 'line-through';
              }
              
              onChange({ textDecoration: newDecoration || 'none' });
            }}
            className={`h-10 rounded-lg border transition-all ${
              style.textDecoration?.includes('underline')
                ? 'bg-accent-purple border-accent-purple text-white shadow-lg shadow-accent-purple/20'
                : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
            }`}
            title="下划线"
          >
            <u>U</u>
          </button>
          
          <button
            onClick={() => {
              const current = style.textDecoration || '';
              const hasUnderline = current.includes('underline');
              const hasStrike = current.includes('line-through');
              
              let newDecoration = '';
              if (!hasStrike) {
                newDecoration = hasUnderline ? 'underline line-through' : 'line-through';
              } else if (hasUnderline) {
                newDecoration = 'underline';
              }
              
              onChange({ textDecoration: newDecoration || 'none' });
            }}
            className={`h-10 rounded-lg border transition-all ${
              style.textDecoration?.includes('line-through')
                ? 'bg-accent-purple border-accent-purple text-white shadow-lg shadow-accent-purple/20'
                : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
            }`}
            title="删除线"
          >
            <s>S</s>
          </button>
        </div>
      </div>
    </div>
  );
}