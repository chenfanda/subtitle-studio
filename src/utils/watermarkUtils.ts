import type { WatermarkConfig } from '@/types/settings';
import { useSettingsStore } from '@/stores/useSettingsStore';

/**
 * 从store获取水印配置
 */
const getWatermarkConfig = (): WatermarkConfig | null => {
  try {
    const state = useSettingsStore.getState();
    return state.watermark || null;
  } catch (error) {
    console.error('获取水印配置失败:', error);
    return null;
  }
};

/**
 * 加载图片并返回HTMLImageElement
 */
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 处理跨域图片
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片加载失败: ${url}`));
    img.src = url;
  });
};

/**
 * 计算Canvas画布尺寸
 */
const calculateCanvasSize = (config: WatermarkConfig): { width: number; height: number } => {
  const padding = 24; // 内边距 (对应 px-3 py-2 → 12px*2)
  const gap = 8; // 元素间距 (对应 space-x-2)
  
  const fontSize = config.fontSize || 16;
  const imageHeight = fontSize * 1.5; // 与 Watermark.tsx 一致
  
  let width = padding * 2;
  let height = padding * 2;
  
  const hasImage = !!config.imageUrl;
  const hasText = !!config.text;
  
  // 预估图片实际宽度 (需要考虑maxWidth限制)
  let imageWidth = 0;
  if (hasImage) {
    // 这里先预估，实际宽度会在加载图片后重新计算
    imageWidth = Math.min(imageHeight * 2, 120); // 假设宽图，最大120px
  }
  
  // 估算文本宽度
  const textWidth = hasText ? estimateTextWidth(config.text!, config) : 0;
  
  const layout = config.layout || 'row';
  
  switch (layout) {
    case 'row':
    case 'row-reverse':
      width += imageWidth + textWidth;
      if (hasImage && hasText) width += gap;
      height += Math.max(imageHeight, fontSize * 1.2);
      break;
      
    case 'col':
    case 'col-reverse':
      width += Math.max(imageWidth, textWidth);
      height += imageHeight + fontSize * 1.2;
      if (hasImage && hasText) height += gap;
      break;
      
    case 'overlay':
      width += Math.max(imageWidth, textWidth);
      height += Math.max(imageHeight, fontSize * 1.2);
      break;
  }
  
  return {
    width: Math.ceil(width),
    height: Math.ceil(height)
  };
};

/**
 * 估算文本宽度 (粗略计算)
 */
const estimateTextWidth = (text: string, config: WatermarkConfig): number => {
  const fontSize = config.fontSize || 16;
  const fontWeight = config.fontWeight || 400;
  
  // 粗略估算: 英文字符约0.6倍fontSize, 中文约1倍fontSize
  const avgCharWidth = /[\u4e00-\u9fa5]/.test(text) ? fontSize * 0.9 : fontSize * 0.6;
  return text.length * avgCharWidth;
};

/**
 * 绘制背景 (包括透明度和圆角)
 */
const drawBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: WatermarkConfig
) => {
  const bgColor = config.backgroundColor || 'rgba(0, 0, 0, 0)';
  const opacity = (config.opacity || 100) / 100;
  
  ctx.save();
  ctx.globalAlpha = opacity;
  
  // 绘制圆角矩形
  const radius = 8; // 对应 rounded-lg
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.quadraticCurveTo(width, 0, width, radius);
  ctx.lineTo(width, height - radius);
  ctx.quadraticCurveTo(width, height, width - radius, height);
  ctx.lineTo(radius, height);
  ctx.quadraticCurveTo(0, height, 0, height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
};

/**
 * 绘制图片 (完全匹配 Watermark.tsx 的渲染逻辑)
 */
const drawImageElement = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  targetHeight: number
) => {
  // 与 Watermark.tsx 完全一致的逻辑:
  // height: `${config.fontSize * 1.5}px`
  // width: 'auto'
  // maxWidth: '120px'
  
  const aspectRatio = img.width / img.height;
  let drawHeight = targetHeight;
  let drawWidth = drawHeight * aspectRatio; // width: auto (保持宽高比)
  
  // 限制最大宽度
  if (drawWidth > 120) {
    drawWidth = 120;
    drawHeight = drawWidth / aspectRatio;
  }
  
  ctx.drawImage(img, x, y, drawWidth, drawHeight);
  
  return { drawWidth, drawHeight };
};

/**
 * 绘制文本
 */
const drawTextElement = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  config: WatermarkConfig,
  isOverlay: boolean = false
) => {
  const fontSize = config.fontSize || 16;
  const fontWeight = config.fontWeight || 400;
  const fontStyle = config.fontStyle || 'normal';
  const fontFamily = config.fontFamily || 'Arial, sans-serif';
  const color = config.color || '#ffffff';
  const textDecoration = config.textDecoration || 'none';
  
  ctx.save();
  
  // 设置字体
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  
  // overlay模式添加阴影
  if (isOverlay) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
  }
  
  ctx.fillText(text, x, y);
  
  // 处理文本装饰 (下划线/删除线)
  if (textDecoration !== 'none') {
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, fontSize / 16);
    
    if (textDecoration === 'underline') {
      const underlineY = y + fontSize * 0.3;
      ctx.beginPath();
      ctx.moveTo(x, underlineY);
      ctx.lineTo(x + textWidth, underlineY);
      ctx.stroke();
    } else if (textDecoration === 'line-through') {
      const strikeY = y;
      ctx.beginPath();
      ctx.moveTo(x, strikeY);
      ctx.lineTo(x + textWidth, strikeY);
      ctx.stroke();
    }
  }
  
  ctx.restore();
  
  return ctx.measureText(text).width;
};

/**
 * 根据布局模式计算元素位置
 */
const calculateElementPositions = (
  canvasWidth: number,
  canvasHeight: number,
  imageSize: number,
  imageWidth: number,
  textWidth: number,
  config: WatermarkConfig
): {
  imagePos: { x: number; y: number };
  textPos: { x: number; y: number };
} => {
  const padding = 12;
  const gap = 8;
  const fontSize = config.fontSize || 16;
  const layout = config.layout || 'row';
  
  const hasImage = !!config.imageUrl;
  const hasText = !!config.text;
  
  let imageX = padding;
  let imageY = padding;
  let textX = padding;
  let textY = padding;
  
  switch (layout) {
    case 'row':
      // 图片在左，文字在右
      imageY = (canvasHeight - imageSize) / 2;
      textX = hasImage ? padding + imageWidth + gap : padding;
      textY = canvasHeight / 2;
      break;
      
    case 'row-reverse':
      // 文字在左，图片在右
      textX = padding;
      textY = canvasHeight / 2;
      imageX = hasText ? padding + textWidth + gap : padding;
      imageY = (canvasHeight - imageSize) / 2;
      break;
      
    case 'col':
      // 图片在上，文字在下
      imageX = (canvasWidth - imageWidth) / 2;
      imageY = padding;
      textX = (canvasWidth - textWidth) / 2;
      textY = hasImage ? padding + imageSize + gap + fontSize * 0.6 : padding + fontSize * 0.6;
      break;
      
    case 'col-reverse':
      // 文字在上，图片在下
      textX = (canvasWidth - textWidth) / 2;
      textY = padding + fontSize * 0.6;
      imageX = (canvasWidth - imageWidth) / 2;
      imageY = hasText ? padding + fontSize * 1.2 + gap : padding;
      break;
      
    case 'overlay':
      // 居中叠加
      imageX = (canvasWidth - imageWidth) / 2;
      imageY = (canvasHeight - imageSize) / 2;
      textX = (canvasWidth - textWidth) / 2;
      textY = canvasHeight / 2;
      break;
  }
  
  return {
    imagePos: { x: imageX, y: imageY },
    textPos: { x: textX, y: textY }
  };
};

/**
 * 使用Canvas生成水印快照
 */
export const captureWatermarkSnapshot = async (referenceHeight?: number): Promise<Blob | null> => {
  try {
    // 1. 获取配置
    const config = getWatermarkConfig();
    if (!config || !config.enabled) {
      console.warn('水印未启用或配置不存在');
      return null;
    }
    
    const fontSize = config.fontSize || 16;
    const imageHeight = fontSize * 1.5;
    
    // 2. 加载图片 (如果有) - 必须先加载才能知道实际尺寸
    let img: HTMLImageElement | null = null;
    let actualImageWidth = 0;
    let actualImageHeight = 0;
    
    if (config.imageUrl) {
      try {
        img = await loadImage(config.imageUrl);
        
        // 计算实际绘制尺寸 (与 Watermark.tsx 完全一致)
        const aspectRatio = img.width / img.height;
        actualImageHeight = imageHeight;
        actualImageWidth = actualImageHeight * aspectRatio;
        
        // 应用 maxWidth 限制
        if (actualImageWidth > 120) {
          actualImageWidth = 120;
          actualImageHeight = actualImageWidth / aspectRatio;
        }
      } catch (error) {
        console.warn('水印图片加载失败，将只显示文字', error);
      }
    }
    
    // 3. 创建临时Canvas测量文本宽度
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      throw new Error('无法创建Canvas上下文');
    }
    
    tempCtx.font = `${config.fontStyle || 'normal'} ${config.fontWeight || 400} ${fontSize}px ${config.fontFamily || 'Arial'}`;
    const textWidth = config.text ? tempCtx.measureText(config.text).width : 0;
    
    // 4. 计算实际Canvas尺寸 (使用真实的图片宽度和文本宽度)
    const padding = 12; // px-3 = 12px
    const gap = 8; // space-x-2 = 8px
    const layout = config.layout || 'row';
    
    let canvasWidth = padding * 2;
    let canvasHeight = padding * 2;
    
    const hasImage = !!img;
    const hasText = !!config.text;
    
    switch (layout) {
      case 'row':
      case 'row-reverse':
        canvasWidth += actualImageWidth + textWidth;
        if (hasImage && hasText) canvasWidth += gap;
        canvasHeight += Math.max(actualImageHeight, fontSize * 1.2);
        break;
        
      case 'col':
      case 'col-reverse':
        canvasWidth += Math.max(actualImageWidth, textWidth);
        canvasHeight += actualImageHeight + fontSize * 1.2;
        if (hasImage && hasText) canvasHeight += gap;
        break;
        
      case 'overlay':
        canvasWidth += Math.max(actualImageWidth, textWidth);
        canvasHeight += Math.max(actualImageHeight, fontSize * 1.2);
        break;
    }
    
    canvasWidth = Math.ceil(canvasWidth);
    canvasHeight = Math.ceil(canvasHeight);
    
    // 5. 创建最终Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法创建Canvas上下文');
    }
    
    // 设置高清画布 (scale: 2)
    const scale = 2;
    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    // ctx.scale(scale, scale);
    
    // 6. 绘制背景
    drawBackground(ctx, canvasWidth, canvasHeight, config);
    
    // 7. 计算元素位置
    const positions = calculateElementPositions(
      canvasWidth,
      canvasHeight,
      imageHeight,
      actualImageWidth,
      textWidth,
      config
    );
    
    // 8. 绘制元素
    const isOverlay = config.layout === 'overlay';
    
    // 先绘制图片 (overlay模式下图片在底层)
    if (img) {
      drawImageElement(
        ctx,
        img,
        positions.imagePos.x,
        positions.imagePos.y,
        imageHeight // 传入目标高度，函数内部会按比例计算宽度
      );
    }
    
    // 再绘制文字 (overlay模式下文字在顶层)
    if (config.text) {
      drawTextElement(
        ctx,
        config.text,
        positions.textPos.x,
        positions.textPos.y,
        config,
        isOverlay
      );
    }
    
    // 9. 转换为Blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
    
  } catch (error) {
    console.error('水印生成快照失败:', error);
    return null;
  }
};