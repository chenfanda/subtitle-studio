import { useState } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUIStore } from '@/stores/useUIStore';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';
import { 
  applyStyleToAllSegments,
  applyStyleToSegments,
  createRichTextFromPlainText,
  mergeAdjacentSegments
} from '@/utils/textStyleUtils';

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

interface SubtitleQuickToolbarProps {
  subtitleId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function SubtitleQuickToolbar({ subtitleId, position, onClose }: SubtitleQuickToolbarProps) {
  const { subtitles, updateSubtitle, updateSubtitleRichText } = useProjectStore();
  const { setActivePanel, richTextSelection } = useUIStore();
  const [isVisible, setIsVisible] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBrightness, setShowBrightness] = useState(false);
  
  const subtitle = subtitles.find(s => s.id === subtitleId);
  
  // ✅ 修复：从正确的位置读取样式
  const currentStyle = subtitle?.richText && subtitle.richText.length > 0
    ? (subtitle.richText[0].style || subtitle.style || DEFAULT_SUBTITLE_STYLE)
    : (subtitle?.style || DEFAULT_SUBTITLE_STYLE);
  
  const currentGlowColor = currentStyle.shadow?.enabled ? currentStyle.shadow.color : null;
  const currentBrightness = currentStyle.shadow?.enabled ? currentStyle.shadow.blur : 15;

  const applyStyleUpdate = (styleUpdate: Partial<typeof currentStyle>) => {
    if (!subtitle) return;

    // 检查是否有富文本选中状态
    const hasRichTextSelection = richTextSelection && richTextSelection.subtitleId === subtitleId;

    if (hasRichTextSelection) {
      // 应用到选中片段
      let richTextSegments = subtitle.richText;
      
      if (!richTextSegments) {
        richTextSegments = createRichTextFromPlainText(subtitle.text, subtitle.style);
      }
      
      const updatedSegments = applyStyleToSegments(
        richTextSegments,
        richTextSelection.startIndex,
        richTextSelection.endIndex,
        styleUpdate
      );
      
      const optimizedSegments = mergeAdjacentSegments(updatedSegments);
      updateSubtitleRichText(subtitleId, optimizedSegments);
      
    } else {
      // 应用到整个字幕
      if (subtitle.richText) {
        const updatedSegments = applyStyleToAllSegments(subtitle.richText, styleUpdate);
        updateSubtitleRichText(subtitleId, updatedSegments);
      } else {
        const newStyle = { ...currentStyle, ...styleUpdate };
        updateSubtitle(subtitleId, { style: newStyle });
      }
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  const handleColorSelect = (color: string) => {
    applyStyleUpdate({
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
      applyStyleUpdate({
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
    applyStyleUpdate({
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
    applyStyleUpdate({ fontFamily });
  };

  const handleFontSizeChange = (fontSize: number) => {
    applyStyleUpdate({ fontSize });
  };

  const handleStyleEdit = () => {
    setActivePanel('text');
    handleClose();
  };

  if (!isVisible || !subtitle) return null;

  return (
    <div 
      className="absolute z-30 bg-gray-900 border border-gray-700 rounded-md shadow-lg px-2 py-1.5 flex items-center gap-1"
      style={{
        left: `${position.x}%`,
        top: `calc(${position.y}% + 40px)`,
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
          <div className="absolute top-8 left-0 bg-gray-800 border border-gray-600 rounded p-2 grid grid-cols-4 gap-1 min-w-32">
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
          <div className="absolute top-8 left-0 bg-gray-800 border border-gray-600 rounded p-2 w-24">
            <input
              type="range"
              min="5"
              max="30"
              value={currentBrightness}
              onChange={(e) => handleBrightnessChange(Number(e.target.value))}
              className="w-full"
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
        onClick={handleStyleEdit}
        className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-white"
        title="样式"
      >
        样式
      </button>

      <button
        onClick={handleClose}
        className="w-5 h-5 text-gray-400 hover:text-white text-xs ml-1"
        title="关闭"
      >
        ✕
      </button>
    </div>
  );
}