import { useState } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUIStore } from '@/stores/useUIStore';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';

interface QuickToolbarProps {
  targetType: 'subtitle' | 'textElement';
  targetId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

const FONT_OPTIONS = [
  'Alibaba PuHuiTi',
  'PingFang SC', 
  'Microsoft YaHei',
  'Arial',
  'sans-serif'
];

const FONT_SIZE_OPTIONS = [
  12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 48
];

const GLOW_COLORS = [
  '#00BFFF', '#FFD700', '#FF4500', '#00FF7F', '#9932CC', '#FFFFFF', '#FF69B4'
];

export function QuickToolbar({ targetType, targetId, position, onClose }: QuickToolbarProps) {
  const { subtitles, textElements, updateSubtitle, updateTextElement } = useProjectStore();
  const { setShowRichTextEditor, setRichTextEditorTarget } = useUIStore();
  
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBrightness, setShowBrightness] = useState(false);
  
  // ✅ 获取当前对象
  const currentObject = targetType === 'subtitle'
    ? subtitles.find(s => s.id === targetId)
    : textElements.find(e => e.id === targetId);
  
  if (!currentObject) return null;
  
  const currentStyle = currentObject.style || DEFAULT_SUBTITLE_STYLE;
  const currentGlowColor = currentStyle.shadow?.enabled ? currentStyle.shadow.color : null;
  const currentBrightness = currentStyle.shadow?.enabled ? currentStyle.shadow.blur : 15;
  
  // ✅ 统一的样式更新方法
  const handleStyleUpdate = (updates: Partial<typeof currentStyle>) => {
    if (targetType === 'subtitle') {
      updateSubtitle(targetId, { style: { ...currentStyle, ...updates } });
    } else {
      updateTextElement(targetId, { style: { ...currentStyle, ...updates } });
    }
  };
  
  const handleColorSelect = (color: string) => {
    handleStyleUpdate({
      shadow: {
        enabled: true,
        color: color,
        offsetX: 0,
        offsetY: 0,
        blur: currentBrightness
      }
    });
    setShowColorPicker(false);
  };
  
  const handleBrightnessChange = (brightness: number) => {
    if (currentGlowColor) {
      handleStyleUpdate({
        shadow: {
          enabled: true,
          color: currentGlowColor,
          offsetX: 0,
          offsetY: 0,
          blur: brightness
        }
      });
    }
  };
  
  const handleRemoveGlow = () => {
    handleStyleUpdate({
      shadow: {
        enabled: false,
        color: '#000000',
        offsetX: 0,
        offsetY: 0,
        blur: 0
      }
    });
    setShowColorPicker(false);
  };
  
  const handleFontChange = (fontFamily: string) => {
    handleStyleUpdate({ fontFamily });
  };
  
  const handleFontSizeChange = (fontSize: number) => {
    handleStyleUpdate({ fontSize });
  };
  
  const handleStyleClick = () => {
    // ✅ 打开右侧富文本编辑器
    setRichTextEditorTarget({ type: targetType, id: targetId });
    setShowRichTextEditor(true);
    onClose();
  };
  
  return (
    <div 
      className="absolute z-40 bg-gray-900 border border-gray-700 rounded-md shadow-lg px-2 py-1.5 flex items-center gap-1"
      style={{
        left: `${position.x}%`,
        top: `calc(${position.y}% + 60px)`,
        transform: 'translateX(-50%)'
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 发光颜色 */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-6 h-6 rounded-full border-2 border-gray-600 hover:border-gray-400 transition-colors"
          style={{ backgroundColor: currentGlowColor || '#666666' }}
          title="发光颜色"
        />
        
        {showColorPicker && (
          <div className="absolute top-8 left-0 bg-gray-800 border border-gray-600 rounded p-2 grid grid-cols-4 gap-1 min-w-32 z-50">
            <button
              onClick={handleRemoveGlow}
              className="w-5 h-5 bg-gray-600 rounded border hover:border-gray-400 text-xs text-white flex items-center justify-center"
              title="移除发光"
            >
              ✕
            </button>
            {GLOW_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className="w-5 h-5 rounded border border-gray-600 hover:border-gray-400"
                style={{ backgroundColor: color }}
                title={`选择 ${color}`}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* 发光亮度 */}
      <div className="relative">
        <button
          onClick={() => setShowBrightness(!showBrightness)}
          className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-white"
          title="亮度"
          disabled={!currentGlowColor}
        >
          ☀
        </button>
        
        {showBrightness && currentGlowColor && (
          <div className="absolute top-8 left-0 bg-gray-800 border border-gray-600 rounded p-2 w-24 z-50">
            <input
              type="range"
              min="5"
              max="30"
              value={currentBrightness}
              onChange={(e) => handleBrightnessChange(Number(e.target.value))}
              className="w-full accent-accent-purple"
            />
            <div className="text-xs text-gray-400 text-center mt-1">{currentBrightness}</div>
          </div>
        )}
      </div>
      
      {/* 字体选择 */}
      <select
        value={currentStyle.fontFamily}
        onChange={(e) => handleFontChange(e.target.value)}
        className="px-1.5 py-0.5 text-xs bg-gray-800 border border-gray-600 rounded text-white min-w-20"
      >
        {FONT_OPTIONS.map(font => (
          <option key={font} value={font}>{font.split(',')[0]}</option>
        ))}
      </select>
      
      {/* 字号 */}
      <select
        value={currentStyle.fontSize}
        onChange={(e) => handleFontSizeChange(Number(e.target.value))}
        className="px-1.5 py-0.5 text-xs bg-gray-800 border border-gray-600 rounded text-white w-12"
      >
        {FONT_SIZE_OPTIONS.map(size => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
      
      {/* ✅ 样式按钮（打开富文本编辑器） */}
      <button
        onClick={handleStyleClick}
        className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-white"
        title="样式"
      >
        样式
      </button>
      
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="w-5 h-5 text-gray-400 hover:text-white text-xs ml-1"
        title="关闭"
      >
        ✕
      </button>
    </div>
  );
}