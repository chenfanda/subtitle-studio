// utils/ffmpegUtils.ts

export type FFmpegTarget = 'frontend' | 'backend';

const FONT_MAP: Record<string, string> = {
  'AlibabaPuHuiTi-3-105-Heavy': 'AlibabaPuHuiTi-3-105-Heavy.ttf',
  'AlibabaPuHuiTi-3-115-Black': 'AlibabaPuHuiTi-3-115-Black.ttf',
  'ZCOOL_Addict_Italic': 'ZCOOL_Addict_Italic.ttf',
  'ZcoolKuaiLe-Regular': 'ZcoolKuaiLe-Regular.ttf',
  'ZcoolkuheiT-Regular': 'ZcoolkuheiT-Regular.ttf',
  'ZcoolQingKeHuangYou-Regular': 'ZcoolQingKeHuangYou-Regular.ttf',
  'ZcoolwenyiT-Regular': 'ZcoolwenyiT-Regular.ttf',
  'Zcoolxiaowei-LOGOT': 'Zcoolxiaowei-LOGOT.ttf',
  'ZcoolYuYangT-Bold': 'ZcoolYuYangT-Bold.ttf',
  'ZcoolYuYangT-Regular': 'ZcoolYuYangT-Regular.ttf',
  
  'Microsoft YaHei': 'MicrosoftYaHei-Bold.ttf', 

  '"Alibaba PuHuiTi", sans-serif': 'AlibabaPuHuiTi-3-105-Heavy.ttf',
  '"ZcoolKuaiLe", sans-serif': 'ZcoolKuaiLe-Regular.ttf',
  '"ZcoolkuheiT", sans-serif': 'ZcoolkuheiT-Regular.ttf',
  '"ZcoolYuYangT", sans-serif': 'ZcoolYuYangT-Regular.ttf',
  '"ZcoolQingKeHuangYou", sans-serif': 'ZcoolQingKeHuangYou-Regular.ttf',
  '"ZcoolwenyiT", sans-serif': 'ZcoolwenyiT-Regular.ttf',
  '"Zcoolxiaowei", sans-serif': 'Zcoolxiaowei-LOGOT.ttf',
  '"ZCOOL Addict", sans-serif': 'ZCOOL_Addict_Italic.ttf',

  '"Microsoft YaHei", "微软雅黑", "SimHei", "黑体", sans-serif': 'MicrosoftYaHei-Bold.ttf',
};

export class InputMapper {
  private map = new Map<string, { index: number; localPath: string }>();
  public remoteUrls: { url: string; localPath: string }[] = [];

  addInput(url: string): string {
    if (this.map.has(url)) {
      return this.map.get(url)!.localPath;
    }

    const index = this.map.size;
    const pathPart = url.split('?')[0];
    const parts = pathPart.split('.');
    let extension = parts.length > 1 ? parts.pop() : undefined;
    if (!extension || extension.includes(':') || extension.includes('/')) {
      extension = 'mp4';
    }
    const localPath = `/media/input_${index}.${extension}`;

    this.map.set(url, { index, localPath });
    this.remoteUrls.push({ url, localPath });

    return localPath;
  }

  public getIndex(url: string): number {
    if (!this.map.has(url)) {
      console.error(`URL not found in InputMapper: ${url}. Defaulting to index 0.`);
      return 0;
    }
    return this.map.get(url)!.index;
  }
}

export const msToS = (ms: number): number => ms / 1000;

export const convertHexToFfmpegHex = (hex: string): string => {
  if (hex.startsWith('#')) {
    hex = hex.substring(1);
  }
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length === 8) {
    hex = hex.substring(0, 6);
  }
  return `0x${hex}`;
};

export const parseCssColor = (cssColor: string): { hex: string; alpha: string } => {
  if (cssColor === 'transparent') {
    return { hex: '0x000000', alpha: '0.0' };
  }

  let match = cssColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (match) {
    return { hex: `0x${match[1]}${match[2]}${match[3]}`, alpha: '1.0' };
  }

  match = cssColor.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
  if (match) {
    return {
      hex: `0x${match[1]}${match[1]}${match[2]}${match[2]}${match[3]}${match[3]}`,
      alpha: '1.0',
    };
  }

  match = cssColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (match) {
    const hexAlpha = parseInt(match[4], 16);
    const decimalAlpha = (hexAlpha / 255).toFixed(2);
    return { hex: `0x${match[1]}${match[2]}${match[3]}`, alpha: decimalAlpha };
  }

  match = cssColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    const a = match[4] ? parseFloat(match[4]).toFixed(2) : '1.0';
    return { hex: `0x${r}${g}${b}`, alpha: a };
  }

  console.warn(`无法解析颜色: ${cssColor}, 使用默认值`);
  return { hex: '0x000000', alpha: '0.5' };
};

export const escapeFfmpegText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/:/g, '\\:')
    .replace(/%/g, '%%');
};

export const getFontPath = (fontFamily: string, target: FFmpegTarget): string => {
  let fontFile = FONT_MAP[fontFamily];

  if (!fontFile) {
    const mainFont = fontFamily.split(',')[0].replace(/"/g, '');
    fontFile = FONT_MAP[mainFont];
  }
  
  if (!fontFile) {
    console.warn(`Font not found: ${fontFamily}. Defaulting to ZcoolKuaiLe.`);
    fontFile = FONT_MAP['ZcoolKuaiLe-Regular'];
  }
  
  if (target === 'frontend') {
    return `/fonts/${fontFile}`;
  } else {
    return `/usr/share/fonts/${fontFile}`;
  }
};