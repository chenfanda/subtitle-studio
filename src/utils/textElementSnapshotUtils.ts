import type { TextElement } from '@/types/textElement';
import type { TextStyleConfig } from '@/types/textStyle';

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error('Url is empty'));
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image load failed: ${url}`));
    img.src = url;
  });
};

const parsePadding = (padding?: string | number) => {
  if (typeof padding === 'number') return { t: padding, r: padding, b: padding, l: padding };
  if (!padding) return { t: 10, r: 20, b: 10, l: 20 };
  const parts = padding.replace(/px/g, '').split(' ').map(Number);
  if (parts.length === 1) return { t: parts[0], r: parts[0], b: parts[0], l: parts[0] };
  if (parts.length === 2) return { t: parts[0], r: parts[1], b: parts[0], l: parts[1] };
  if (parts.length === 4) return { t: parts[0], r: parts[1], b: parts[2], l: parts[3] };
  return { t: 10, r: 20, b: 10, l: 20 };
};

const extractUrl = (bgString?: string) => {
  if (!bgString) return null;
  const match = bgString.match(/url\("?([^"]+)"?\)/);
  return match ? match[1] : null;
};

export const captureTextElementSnapshot = async (
  element: TextElement,
  scaleFactor: number = 2,
  referenceWidth: number = 1920
): Promise<Blob | null> => {
  try {
    const style = element.style as any as TextStyleConfig;
    const position = element.position as any;
    
    // 1. 加载资源 (背景图和图标)
    let bgImg: HTMLImageElement | null = null;
    let iconImg: HTMLImageElement | null = null;
    const bgUrl = extractUrl(style.backgroundImage);
    if (bgUrl) bgImg = await loadImage(bgUrl);
    if (style.icon) iconImg = await loadImage(style.icon);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 2. 测量
    const fontSize = style.fontSize || 24;
    ctx.font = `${style.fontStyle || 'normal'} ${style.fontWeight || 400} ${fontSize}px ${style.fontFamily || 'Arial'}`;
    const textWidth = Math.ceil(ctx.measureText(element.text).width);
    const textHeight = fontSize * 1.2;

    const iconSize = style.iconSize || fontSize * 1.2;
    const iconW = iconImg ? iconSize : 0;
    const iconH = iconImg ? iconSize : 0;

    const pad = parsePadding(style.padding);
    const gap = style.gap ? parseInt(String(style.gap).replace('px', ''), 10) : 8;

    // 3. 计算尺寸 (兼容所有模板)
    const contentW = iconW + (iconImg ? gap : 0) + textWidth;
    const contentH = Math.max(iconH, textHeight);

    // 获取模板定义的最小尺寸
    const minW = parseInt(String(style.minWidth || 0).replace('px', ''));
    const minH = parseInt(String((style as any).minHeight || 0).replace('px', ''));

    let finalW = Math.max(contentW + pad.l + pad.r, minW);
    let finalH = Math.max(contentH + pad.t + pad.b, minH);

    // 百分比宽度处理
    if (position.width && position.width > 0) {
      finalW = Math.max(finalW, (referenceWidth * position.width) / 100);
    }

    // 安全余量：增加 10px 防止切边
    const margin = 10;
    const canvasW = Math.ceil(finalW + margin);
    const canvasH = Math.ceil(finalH + margin);

    // 4. 初始化画布
    canvas.width = canvasW * scaleFactor;
    canvas.height = canvasH * scaleFactor;
    ctx.scale(scaleFactor, scaleFactor);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 5. 绘制背景 (分流处理)
    const drawX = margin / 2;
    const drawY = margin / 2;
    const drawW = finalW;
    const drawH = finalH;

    if (bgImg) {
      // --- 标题/便签模式 ---
      ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
    } else if (style.backgroundColor && style.backgroundColor !== 'transparent') {
      // --- 媒体模式 ---
      ctx.fillStyle = style.backgroundColor;
      const radius = drawH / 2; // 强制胶囊圆角
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(drawX, drawY, drawW, drawH, radius);
      } else {
        ctx.arc(drawX + radius, drawY + radius, radius, Math.PI, Math.PI * 1.5);
        ctx.lineTo(drawX + drawW - radius, drawY);
        ctx.arc(drawX + drawW - radius, drawY + radius, radius, Math.PI * 1.5, Math.PI * 2);
        ctx.lineTo(drawX + drawW, drawY + drawH - radius);
        ctx.arc(drawX + drawW - radius, drawY + drawH - radius, radius, 0, Math.PI * 0.5);
        ctx.lineTo(drawX + radius, drawY + drawH);
        ctx.arc(drawX + radius, drawY + drawH - radius, radius, Math.PI * 0.5, Math.PI);
      }
      ctx.closePath();
      ctx.fill();
    }

    // 6. 绘制内容
    const centerY = canvasH / 2;
    const totalContentW = textWidth + (iconImg ? iconW + gap : 0);
    // 水平居中起始点
    let currentX = drawX + (drawW - totalContentW) / 2;

    // 绘制图标
    if (iconImg) {
      const iconY = centerY - iconH / 2;
      ctx.drawImage(iconImg, Math.round(currentX), Math.round(iconY), iconW, iconH);
      currentX += iconW + gap;
    }

    // 绘制文字
    ctx.font = `${style.fontStyle || 'normal'} ${style.fontWeight || 400} ${fontSize}px ${style.fontFamily || 'Arial'}`;
    ctx.fillStyle = style.color || '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    
    ctx.fillText(element.text, Math.round(currentX), centerY + 1);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  } catch (error) {
    console.error('Snapshot failed:', error);
    return null;
  }
};