import { useState, useEffect } from 'react';
import { useTextStyleStore, useSelectedTemplate } from '@/stores/useTextStyleStore';
import { useSelectedSubtitles, useRichTextSelection } from '@/stores/useUIStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { convertStyleToCSS } from '@/utils/textStyleUtils';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';
import type { TextStyleTemplate } from '@/types/textStyle';
import type { SubtitleStyle } from '@/types/subtitle';

interface StylePreviewCardProps {
  template: TextStyleTemplate;
}

export function StylePreviewCard({ template }: StylePreviewCardProps) {
  const selectedTemplate = useSelectedTemplate();
  const selectTemplate = useTextStyleStore((state) => state.selectTemplate);
  const applyToRange = useTextStyleStore((state) => state.applyToRange);
  const selectedSubtitleIds = useSelectedSubtitles();
  const richTextSelection = useRichTextSelection();
  const { subtitles, updateSubtitle, updateSubtitleRichText } = useProjectStore();
  
  const [isApplied, setIsApplied] = useState(false);
  const [hasThisStyle, setHasThisStyle] = useState(false);
  
  const isSelected = selectedTemplate?.id === template.id;
  const hasSelectedSubtitles = selectedSubtitleIds.length > 0;
  const hasRichTextSelection = richTextSelection && selectedSubtitleIds.includes(richTextSelection.subtitleId);
  
  // 转换样式配置为字幕样式
  const convertedStyle: SubtitleStyle = {
    fontSize: template.style.fontSize,
    fontFamily: template.style.fontFamily,
    fontWeight: template.style.fontWeight,
    fontStyle: template.style.fontStyle,
    color: template.style.color,
    backgroundColor: template.style.backgroundColor,
    position: 'bottom',
    alignment: 'center',
    opacity: 1,
    shadow: {
      enabled: !!template.style.shadow,
      color: template.style.shadow?.color || '#000000',
      offsetX: template.style.shadow?.offsetX || 0,
      offsetY: template.style.shadow?.offsetY || 0,
      blur: template.style.shadow?.blur || 0,
    }
  };
  
  const previewStyle = convertStyleToCSS(convertedStyle);

  // 检查当前字幕是否已应用此样式
  useEffect(() => {
    if (!hasSelectedSubtitles) {
      setHasThisStyle(false);
      return;
    }

    const selectedSubtitle = subtitles.find(s => s.id === selectedSubtitleIds[0]);
    if (!selectedSubtitle) {
      setHasThisStyle(false);
      return;
    }

    // 检查样式是否匹配
    const currentStyle = selectedSubtitle.style || DEFAULT_SUBTITLE_STYLE;
    const styleMatches = (
      currentStyle.fontSize === convertedStyle.fontSize &&
      currentStyle.fontFamily === convertedStyle.fontFamily &&
      currentStyle.fontWeight === convertedStyle.fontWeight &&
      currentStyle.color === convertedStyle.color
    );

    setHasThisStyle(styleMatches);
  }, [selectedSubtitleIds, hasSelectedSubtitles, convertedStyle]);

  const handleCardClick = () => {
    selectTemplate(template);
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!hasThisStyle) {
      // 应用样式
      if (hasRichTextSelection) {
        applyToRange(
          richTextSelection.subtitleId,
          richTextSelection.startIndex,
          richTextSelection.endIndex
        );
      } else {
        selectedSubtitleIds.forEach(subtitleId => {
          applyToRange(subtitleId);
        });
      }
      
      // 应用成功反馈
      setIsApplied(true);
      setTimeout(() => setIsApplied(false), 1500);
    } else {
      // 移除样式（恢复默认）
      handleRemoveStyle();
    }
  };

  const handleRemoveStyle = () => {
    const defaultStyle = { ...DEFAULT_SUBTITLE_STYLE };
    
    if (hasRichTextSelection) {
      // 移除选中片段的样式
      const subtitle = subtitles.find(s => s.id === richTextSelection.subtitleId);
      if (subtitle?.richText) {
        const updatedSegments = subtitle.richText.map(segment => {
          // 简化处理：如果是当前模板的样式就重置为默认
          if (segment.style && 
              segment.style.fontSize === convertedStyle.fontSize &&
              segment.style.fontFamily === convertedStyle.fontFamily) {
            return {
              ...segment,
              style: defaultStyle,
              animation: segment.animation // 保留动效
            };
          }
          return segment;
        });
        updateSubtitleRichText(richTextSelection.subtitleId, updatedSegments);
      }
    } else {
      // 移除整个字幕的样式
      selectedSubtitleIds.forEach(subtitleId => {
        const subtitle = subtitles.find(s => s.id === subtitleId);
        if (subtitle?.richText) {
          const updatedSegments = subtitle.richText.map(segment => ({
            ...segment,
            style: defaultStyle,
            animation: segment.animation // 保留动效
          }));
          updateSubtitleRichText(subtitleId, updatedSegments);
        } else {
          updateSubtitle(subtitleId, { style: defaultStyle });
        }
      });
    }
    
    setHasThisStyle(false);
  };

  const getButtonText = () => {
    if (hasThisStyle) {
      return '移除样式';
    }
    if (isApplied) {
      return '✓ 已应用';
    }
    return hasRichTextSelection ? '应用到选中片段' : '应用到整个字幕';
  };

  const getButtonStyle = () => {
    if (hasThisStyle) {
      return 'bg-red-600 hover:bg-red-700 text-white';
    }
    if (isApplied) {
      return 'bg-green-600 text-white';
    }
    return 'bg-accent-purple hover:bg-accent-purple/80 text-white';
  };

  return (
    <button
      onClick={handleCardClick}
      className={`
        relative w-full h-12 rounded-lg border-2 transition-all duration-200
        hover:scale-105 overflow-hidden group
        ${isSelected 
          ? 'border-accent-purple shadow-lg shadow-accent-purple/20' 
          : 'border-border-secondary hover:border-border-primary'
        }
      `}
    >
      <div className="absolute inset-0 bg-bg-secondary flex items-center justify-center">
        <div 
          style={previewStyle}
          className="select-none pointer-events-none text-sm font-medium truncate px-2"
        >
          {template.preview}
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-accent-purple rounded-full" />
      )}

      {hasThisStyle && (
        <div className="absolute top-1 left-1 w-3 h-3 bg-orange-500 rounded-full" />
      )}

      {isApplied && (
        <div className="absolute top-1 left-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      )}

      {isSelected && hasSelectedSubtitles && (
        <div className="absolute bottom-1 left-1 right-1">
          <button
            onClick={handleApply}
            className={`w-full py-1 px-2 text-xs rounded transition-colors ${getButtonStyle()}`}
          >
            {getButtonText()}
          </button>
        </div>
      )}
      
      {isSelected && !hasSelectedSubtitles && (
        <div className="absolute bottom-1 left-1 right-1">
          <div className="w-full py-1 px-2 text-xs bg-gray-600 text-gray-300 rounded text-center">
            请先选择字幕
          </div>
        </div>
      )}
    </button>
  );
}