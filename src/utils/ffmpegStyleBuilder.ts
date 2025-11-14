// utils/ffmpegStyleBuilder.ts

import type { SubtitleStyle, SubtitlePosition } from '@/types/subtitle';
import type { TextElementPosition } from '@/types/textElement';
import type { WatermarkConfig } from '@/types/settings';
import {
  type FFmpegTarget,
  getFontPath,
  convertHexToFfmpegHex,
  parseCssColor
} from './ffmpegUtils';

export const buildTextStyle = (
  style: SubtitleStyle,
  position: SubtitlePosition | TextElementPosition,
  target: FFmpegTarget
): string => {
  const filters: string[] = [];

  filters.push(`fontfile='${getFontPath(style.fontFamily, target)}'`);
  
  const scale = (position as SubtitlePosition).scale || (position as TextElementPosition).scaleY || 1.0;
  const finalFontSize = (style.fontSize || 24) * scale;
  filters.push(`fontsize=${finalFontSize}`);
  
  filters.push(`fontcolor=${convertHexToFfmpegHex(style.color)}`);
  filters.push(`alpha=${style.opacity || 1.0}`);

  const x_percent = position.x || 50;
  const y_percent = position.y || 85;

  switch (style.alignment) {
    case 'left':
      filters.push(`x=(w * ${x_percent} / 100)`);
      break;
    case 'right':
      filters.push(`x=(w * ${x_percent} / 100) - text_w`);
      break;
    case 'center':
    default:
      filters.push(`x=(w * ${x_percent} / 100) - (text_w / 2)`);
      break;
  }

  switch (style.verticalAlignment) {
    case 'top':
      filters.push(`y=(h * ${y_percent} / 100)`);
      break;
    case 'bottom':
      filters.push(`y=(h * ${y_percent} / 100) - text_h`);
      break;
    case 'center':
    default:
      filters.push(`y=(h * ${y_percent} / 100) - (text_h / 2)`);
      break;
  }

  if (style.stroke?.enabled) {
    filters.push(`borderw=${style.stroke.width * finalFontSize / 10}`);
    filters.push(`bordercolor=${convertHexToFfmpegHex(style.stroke.color)}`);
  }

  if (style.highlightColor) {
    filters.push(`shadowcolor=${convertHexToFfmpegHex(style.highlightColor)}`);
    filters.push(`shadowx=0`);
    filters.push(`shadowy=0`);
  } else if (style.shadow?.enabled) {
    filters.push(`shadowcolor=${convertHexToFfmpegHex(style.shadow.color)}`);
    filters.push(`shadowx=${style.shadow.offsetX}`);
    filters.push(`shadowy=${style.shadow.offsetY}`);
  }

  if (style.backgroundColor && style.backgroundColor !== 'transparent') {
    const { hex, alpha: boxAlpha } = parseCssColor(style.backgroundColor);
    filters.push(`box=1`);
    filters.push(`boxcolor=${hex}@${boxAlpha}`);
    
    const cornerRadius = (style.backgroundShape || 0) / 9;
    const boxBorder = Math.max(1, finalFontSize / 4 * cornerRadius);
    filters.push(`boxborderw=${boxBorder}`);
  }

  const subPosWidth = (position as SubtitlePosition).width;
  if (subPosWidth && subPosWidth > 0) {
    const finalWrapWidth = subPosWidth * scale; 
    filters.push(`text_shaping=1`);
    filters.push(`wrap_width=${finalWrapWidth}`);
  }

  return filters.join(':');
};

export const buildWatermarkStyle = (
  config: WatermarkConfig,
  target: FFmpegTarget
): string => {
  const filters: string[] = [];

  filters.push(`fontfile='${getFontPath(config.fontFamily, target)}'`);
  filters.push(`fontsize=${config.fontSize}`);
  filters.push(`fontcolor=${convertHexToFfmpegHex(config.color)}`);

  const alpha = (config.opacity / 100).toFixed(2);
  filters.push(`alpha=${alpha}`);

  if (config.backgroundColor !== 'transparent') {
    const { hex, alpha: boxAlpha } = parseCssColor(config.backgroundColor);
    filters.push(`box=1`);
    filters.push(`boxcolor=${hex}@${boxAlpha}`);
    filters.push(`boxborderw=5`);
  }

  let x, y;
  if (config.positionMode === 'custom') {
    x = `(w - text_w) / 2 + (w * (${config.customPosition.x || 50} - 50) / 100)`;
    y = `(h - text_h) / 2 + (h * (${config.customPosition.y || 50} - 50) / 100)`;
  } else {
    switch (config.position) {
      case 'top-left':
        x = '10';
        y = '10';
        break;
      case 'top-right':
        x = 'w - text_w - 10';
        y = '10';
        break;
      case 'bottom-left':
        x = '10';
        y = 'h - text_h - 10';
        break;
      case 'bottom-right':
        x = 'w - text_w - 10';
        y = 'h - text_h - 10';
        break;
      default:
        x = 'w - text_w - 10';
        y = '10';
    }
  }

  filters.push(`x=${x}`);
  filters.push(`y=${y}`);

  return filters.join(':');
};