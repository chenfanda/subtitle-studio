import { useState, useRef } from 'react';
import { ColorPicker } from './ColorPicker';
import type { SubtitleStyle } from '@/types/subtitle';

interface BasicEffectsSectionProps {
  targetType: 'subtitle' | 'textElement';
  style: SubtitleStyle;
  onChange: (updates: Partial<SubtitleStyle>) => void;
  onSaveStyle: () => void;
}

const FONT_OPTIONS = [
  { value: '"Alibaba PuHuiTi", sans-serif', label: '阿里巴巴普惠体' },
  { value: '"ZcoolKuaiLe", sans-serif', label: '站酷快乐' },
  { value: '"ZcoolkuheiT", sans-serif', label: '站酷酷黑' },
  { value: '"ZcoolYuYangT", sans-serif', label: '站酷渔阳' },
  { value: '"ZcoolQingKeHuangYou", sans-serif', label: '站酷黄油' },
  { value: '"ZcoolwenyiT", sans-serif', label: '站酷文艺' },
  { value: '"Zcoolxiaowei", sans-serif', label: '站酷小薇' },
  { value: '"ZCOOL Addict", sans-serif', label: 'ZCOOL Addict' },
  { value: '"PingFang SC", "苹方-简", sans-serif', label: 'PingFang SC' },
  { value: '"Microsoft YaHei", "微软雅黑", sans-serif', label: 'Microsoft YaHei' },
  { value: 'Arial, "Helvetica Neue", Helvetica, sans-serif', label: 'Arial' },
  { value: 'sans-serif', label: 'Sans Serif' }
];

export function BasicEffectsSection({ 
  targetType, 
  style, 
  onChange,
  onSaveStyle
}: BasicEffectsSectionProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorButtonRef = useRef<HTMLButtonElement>(null);

  const getPickerPosition = () => {
    if (!colorButtonRef.current) return undefined;
    const rect = colorButtonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      left: rect.left
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-text-primary">基本效果</h3>
        <button
          onClick={onSaveStyle}
          className="flex items-center gap-1 text-xs font-medium text-accent-purple hover:text-accent-purple/80 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>保存样式</span>
        </button>
      </div>
      
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
      
      <div>
        <label className="text-xs text-text-secondary mb-2 block">填充</label>
        <div className="relative">
          <button
            ref={colorButtonRef}
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-10 h-10 rounded-full border-2 border-border-secondary hover:border-border-primary transition-colors cursor-pointer"
            style={{ backgroundColor: style.color }}
          />
          
          {showColorPicker && (
            <ColorPicker
              value={style.color}
              onChange={(color) => {
                onChange({ color });
                setShowColorPicker(false);
              }}
              onClose={() => setShowColorPicker(false)}
              position={getPickerPosition()}
              allowTransparent={false}
            />
          )}
        </div>
      </div>
      
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