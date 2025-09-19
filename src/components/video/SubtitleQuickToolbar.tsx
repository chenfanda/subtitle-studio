import { useState } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUIStore } from '@/stores/useUIStore';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';

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

interface SubtitleQuickToolbarProps {
  subtitleId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function SubtitleQuickToolbar({ subtitleId, position, onClose }: SubtitleQuickToolbarProps) {
  const { subtitles, updateSubtitle } = useProjectStore();
  const { setEditingSubtitle } = useUIStore();
  const [isVisible, setIsVisible] = useState(true);
  
  const subtitle = subtitles.find(s => s.id === subtitleId);
  const currentStyle = subtitle?.style || DEFAULT_SUBTITLE_STYLE;

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  const handleHighlight = () => {
    setEditingSubtitle(subtitleId);
    handleClose();
  };

  const handleFontChange = (fontFamily: string) => {
    const newStyle = { ...currentStyle, fontFamily };
    updateSubtitle(subtitleId, { style: newStyle });
    setEditingSubtitle(subtitleId);
    handleClose();
  };

  const handleFontSizeChange = (fontSize: number) => {
    const newStyle = { ...currentStyle, fontSize };
    updateSubtitle(subtitleId, { style: newStyle });
    setEditingSubtitle(subtitleId);
    handleClose();
  };

  const handleStyleEdit = () => {
    setEditingSubtitle(subtitleId);
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
      <button
        onClick={handleHighlight}
        className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-white"
        title="高亮"
      >
        高亮
      </button>

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