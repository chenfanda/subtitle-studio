import type { TextElement } from '@/types/textElement';

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
  _referenceWidth: number = 1920
): Promise<Blob | null> => {
  try {
    const style = element.style as any;
    
    // 1. 加载资源 (修复变量定义)
    let bgImg: HTMLImageElement | null = null;
    let iconImg: HTMLImageElement | null = null;
    const bgUrl = extractUrl(style.backgroundImage);
    if (bgUrl) bgImg = await loadImage(bgUrl);
    if (style.icon) iconImg = await loadImage(style.icon);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 2. 严格读取模板配置 (对齐 socialMedia 模板)
    const fontSize = Number(style.fontSize) || 16;
    const iconSize = Number(style.iconSize) || 40; 
    const gap = parseInt(String(style.gap || '8px').replace('px', ''), 10);
    const minWidth = parseInt(String(style.minWidth || '0px').replace('px', ''), 10);
    const pad = parsePadding(style.padding);

    // 3. 测量文字
    ctx.font = `${style.fontStyle || 'normal'} ${style.fontWeight || 400} ${fontSize}px ${style.fontFamily || 'Arial'}`;
    const textWidth = Math.ceil(ctx.measureText(element.text).width);
    const textHeight = fontSize;

    // 4. 计算内容驱动的尺寸 (不再受 referenceWidth 强制拉伸)
    const iconW = iconImg ? iconSize : 0;
    const iconH = iconImg ? iconSize : 0;
    const contentW = iconW + (iconImg ? gap : 0) + textWidth;
    
    // 背景条的真实尺寸 (紧凑包裹内容)
    const barW = Math.max(contentW + pad.l + pad.r, minWidth);
    const barH = Math.max(Math.max(iconH, textHeight) + pad.t + pad.b, 32); 

    // 增加足够的安全余量防止切边
    const safeMargin = 80;
    const canvasW = barW + safeMargin;
    const canvasH = barH + safeMargin;

    // 5. 初始化画布
    canvas.width = canvasW * scaleFactor;
    canvas.height = canvasH * scaleFactor;
    ctx.scale(scaleFactor, scaleFactor);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const drawX = safeMargin / 2;
    const drawY = safeMargin / 2;

    // 6. 绘制背景 (椭圆胶囊形状)
    if (style.backgroundColor && style.backgroundColor !== 'transparent') {
      ctx.fillStyle = style.backgroundColor;
      const radius = barH / 2; 
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(drawX, drawY, barW, barH, radius);
      } else {
        // 兼容性绘制逻辑
        ctx.arc(drawX + radius, drawY + radius, radius, Math.PI, Math.PI * 1.5);
        ctx.lineTo(drawX + barW - radius, drawY);
        ctx.arc(drawX + barW - radius, drawY + radius, radius, Math.PI * 1.5, Math.PI * 2);
        ctx.lineTo(drawX + barW, drawY + barH - radius);
        ctx.arc(drawX + barW - radius, drawY + barH - radius, radius, 0, Math.PI * 0.5);
        ctx.lineTo(drawX + radius, drawY + barH);
        ctx.arc(drawX + radius, drawY + barH - radius, radius, Math.PI * 0.5, Math.PI);
      }
      ctx.closePath();
      ctx.fill();
    } else if (bgImg) {
      ctx.drawImage(bgImg, drawX, drawY, barW, barH);
    }

    // 7. 绘制内容 (左对齐布局，完全匹配 Padding)
    const centerY = drawY + barH / 2;
    let currentX = drawX + pad.l; 

    if (iconImg) {
      ctx.drawImage(iconImg, currentX, centerY - iconH / 2, iconW, iconH);
      currentX += iconW + gap;
    }

    ctx.font = `${style.fontStyle || 'normal'} ${style.fontWeight || 400} ${fontSize}px ${style.fontFamily || 'Arial'}`;
    ctx.fillStyle = style.color || '#000000';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(element.text, currentX, centerY);

    // 记录关键元数据供导出脚本使用
    (element as any)._snapshotMetadata = { barW, canvasW };

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  } catch (error) {
    console.error('Snapshot failed:', error);
    return null;
  }
};