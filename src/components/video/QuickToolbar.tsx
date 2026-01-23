import { useState, useRef } from 'react';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useTextElementStore } from '@/stores/useTextElementStore';
import { useUIStore } from '@/stores/useUIStore';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';
import { ColorPicker } from '@/components/common/ColorPicker';
import {
  applyStyleToSegments,
  createRichTextFromPlainText
} from '@/utils/textStyleUtils';
import { useTranslation } from '@/hooks/useTranslation';

interface QuickToolbarProps {
  targetType: 'subtitle' | 'textElement';
  targetId: string;
  position: { x: number; y: number };
  onClose: () => void;
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

const FONT_SIZE_OPTIONS = [
  12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 48
];

export function QuickToolbar({ targetType, targetId, position, onClose }: QuickToolbarProps) {
  const { t } = useTranslation();
  const { subtitles, updateSubtitleRichText } = useSubtitleStore();
  const { textElements, updateTextElement } = useTextElementStore();
  const {
    setShowRichTextEditor,
    setRichTextEditorTarget,
    clearRichTextSelection
  } = useUIStore();

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBrightness, setShowBrightness] = useState(false);
  const brightnessButtonRef = useRef<HTMLButtonElement>(null);

  const currentObject = targetType === 'subtitle'
    ? subtitles.find(s => s.id === targetId)
    : textElements.find(e => e.id === targetId);

  if (!currentObject) return null;

  const currentStyle = (
    targetType === 'subtitle' &&
    currentObject.richText &&
    currentObject.richText.length > 0
  )
    ? (currentObject.richText[0].style || DEFAULT_SUBTITLE_STYLE)
    : (currentObject.style || DEFAULT_SUBTITLE_STYLE);

  const currentGlowColor = currentStyle.highlightColor;
  const currentBrightness = currentStyle.highlightIntensity || 15;

  const handleStyleUpdate = (updates: Partial<typeof currentStyle>) => {
    if (targetType === 'subtitle') {
      const selection = useUIStore.getState().richTextSelection;

      if (!selection || selection.subtitleId !== targetId) {
        console.warn('QuickToolbar: Stale selection state. Aborting style update.');
        return;
      }

      const baseRichText = currentObject.richText || createRichTextFromPlainText(currentObject.text, currentStyle);

      const newSegments = applyStyleToSegments(
        baseRichText,
        selection.startIndex,
        selection.endIndex,
        updates
      );
      updateSubtitleRichText(targetId, newSegments);

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
    clearRichTextSelection();
    setRichTextEditorTarget({ type: targetType, id: targetId });
    setShowRichTextEditor(true);
    onClose();
  };



  return (
    <div
      className="absolute z-40 bg-gray-900 border border-gray-700 rounded shadow-lg flex items-center divide-x divide-gray-700"
      style={{
        left: `${position.x}%`,
        top: `calc(${position.y}% + 40px)`,
        transform: 'translateX(-50%)'
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative px-2 py-1">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-6 h-6 rounded-full border-2 border-gray-600 hover:border-gray-400 transition-colors"
          style={{ backgroundColor: currentGlowColor || '#666666' }}
          title={t('发光颜色')}
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
          className="px-3 py-1 text-xs hover:bg-gray-700 text-white transition-colors"
          title={t('亮度')}
          disabled={!currentGlowColor}
        >
          {t('高亮')}
        </button>

        {showBrightness && currentGlowColor && (
          <div className="absolute top-full mt-1 left-0 bg-gray-800 border border-gray-600 rounded p-1 w-32 z-50">
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min="5"
                max="30"
                value={currentBrightness}
                onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                className="w-full accent-accent-purple"
              />
              <div className="text-xs text-gray-400 flex-shrink-0">{currentBrightness}</div>
            </div>
          </div>
        )}
      </div>

      <select
        value={currentStyle.fontFamily}
        onChange={(e) => handleFontChange(e.target.value)}
        className="pl-3 pr-2 py-1 text-xs bg-gray-900 hover:bg-gray-700 border-none rounded-none text-white min-w-20 focus:outline-none"
      >
        {FONT_OPTIONS.map(font => (
          <option key={font.value} value={font.value}>
            {font.label}
          </option>
        ))}
      </select>

      <select
        value={currentStyle.fontSize}
        onChange={(e) => handleFontSizeChange(Number(e.target.value))}
        className="pl-3 pr-8 py-1 text-xs bg-gray-900 hover:bg-gray-700 border-none rounded-none text-white focus:outline-none"
      >
        {FONT_SIZE_OPTIONS.map(size => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>

      <button
        onClick={handleStyleClick}
        className="px-3 py-1 text-xs hover:bg-gray-700 text-white whitespace-nowrap min-w-[52px] flex items-center justify-center transition-colors"
        title={t('样式')}
      >
        {t('样式')}
      </button>

      <button
        onClick={onClose}
        className="px-2 py-1 text-gray-400 hover:text-white text-xs transition-colors"
        title={t('关闭')}
      >
        ✕
      </button>
    </div>
  );
}