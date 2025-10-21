import { useState, useRef } from 'react';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useTextElementStore } from '@/stores/useTextElementStore';
import { useUIStore } from '@/stores/useUIStore';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';
import { ColorPicker } from '@/components/common/ColorPicker';

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

export function QuickToolbar({ targetType, targetId, position, onClose }: QuickToolbarProps) {
  const { subtitles, updateSubtitle } = useSubtitleStore();
  const { textElements, updateTextElement } = useTextElementStore();
  const { setShowRichTextEditor, setRichTextEditorTarget } = useUIStore();
  
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBrightness, setShowBrightness] = useState(false);
  const brightnessButtonRef = useRef<HTMLButtonElement>(null);
  
  const currentObject = targetType === 'subtitle'
    ? subtitles.find(s => s.id === targetId)
    : textElements.find(e => e.id === targetId);
  
  if (!currentObject) return null;
  
  const currentStyle = currentObject.style || DEFAULT_SUBTITLE_STYLE;
  const currentGlowColor = currentStyle.highlightColor;
  const currentBrightness = currentStyle.highlightIntensity || 15;
  
  const handleStyleUpdate = (updates: Partial<typeof currentStyle>) => {
    if (targetType === 'subtitle') {
      updateSubtitle(targetId, { style: { ...currentStyle, ...updates } });
    } else {
      updateTextElement(targetId, { style: { ...currentStyle, ...updates } });
    }
  };
  
  const handleColorSelect = (color: string) => {
    if (color === 'transparent') {
      handleStyleUpdate({
        highlightColor: undefined,
        highlightIntensity: currentBrightness
      });
    } else {
      handleStyleUpdate({
        highlightColor: color,
        highlightIntensity: currentBrightness
      });
    }
    setShowColorPicker(false);
  };
  
  const handleBrightnessChange = (brightness: number) => {
    if (currentGlowColor) {
      handleStyleUpdate({
        highlightColor: currentGlowColor,
        highlightIntensity: brightness
      });
    }
  };
  
  const handleFontChange = (fontFamily: string) => {
    handleStyleUpdate({ fontFamily });
  };
  
  const handleFontSizeChange = (fontSize: number) => {
    handleStyleUpdate({ fontSize });
  };
  
  const handleStyleClick = () => {
    setRichTextEditorTarget({ type: targetType, id: targetId });
    setShowRichTextEditor(true);
    onClose();
  };
  
  return (
    <div 
      className="absolute z-40 bg-gray-900 border border-gray-700 rounded-md shadow-lg px-2 py-1.5 flex items-center gap-1"
      style={{
        left: `${position.x}%`,
        top: `calc(${position.y}% + 50px)`,
        transform: 'translateX(-50%)'
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-6 h-6 rounded-full border-2 border-gray-600 hover:border-gray-400 transition-colors"
          style={{ backgroundColor: currentGlowColor || '#666666' }}
          title="发光颜色"
        />
        
        {showColorPicker && (
          <div className="absolute bottom-full mb-2 left-0 z-50">
            <ColorPicker
              value={currentGlowColor || '#FFFF00'}
              onChange={handleColorSelect}
              onClose={() => setShowColorPicker(false)}
              allowTransparent={true}
            />
          </div>
        )}
      </div>
      
      <div className="relative">
        <button
          ref={brightnessButtonRef}
          onClick={() => setShowBrightness(!showBrightness)}
          className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-white"
          title="亮度"
          disabled={!currentGlowColor}
        >
          ☀
        </button>
        
        {showBrightness && currentGlowColor && (
          <div className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-600 rounded p-2 w-24 z-50">
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
      
      <select
        value={currentStyle.fontFamily}
        onChange={(e) => handleFontChange(e.target.value)}
        className="px-1.5 py-0.5 text-xs bg-gray-800 border border-gray-600 rounded text-white min-w-20"
      >
        {FONT_OPTIONS.map(font => (
          <option key={font} value={font}>{font.split(',')[0]}</option>
        ))}
      </select>
      
      <select
        value={currentStyle.fontSize}
        onChange={(e) => handleFontSizeChange(Number(e.target.value))}
        className="px-1.5 py-0.5 text-xs bg-gray-800 border border-gray-600 rounded text-white w-12"
      >
        {FONT_SIZE_OPTIONS.map(size => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
      
      <button
        onClick={handleStyleClick}
        className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-white whitespace-nowrap min-w-[52px] flex items-center justify-center"
        title="样式"
      >
        样式
      </button>
        
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