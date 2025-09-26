import type { UploadedMediaItem, PlacedMediaItem, UploadedStickerItem, UploadedGifItem } from '@/types/media';
import type { SubtitleItem } from '@/types/subtitle';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateMediaFile = (file: File): FileValidationResult => {
  const supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const fileType = file.type;
  
  if (!supportedFormats.includes(fileType)) {
    return {
      isValid: false,
      error: `不支持的文件格式。支持的格式：JPG, PNG, GIF, WebP`
    };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: '文件过大。最大支持 10MB'
    };
  }

  return { isValid: true };
};

export const createMediaItem = async (file: File): Promise<UploadedMediaItem> => {
  const url = URL.createObjectURL(file);
  const isGif = file.type === 'image/gif';
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const baseItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url,
        preview: url,
        tags: ['custom'],
        width: img.width,
        height: img.height,
        isCustom: true as const,
        uploadedAt: new Date(),
        fileName: file.name,
        fileSize: file.size
      };

      if (isGif) {
        resolve({
          ...baseItem,
          type: 'gif' as const
        } as UploadedGifItem);
      } else {
        resolve({
          ...baseItem,
          type: 'sticker' as const
        } as UploadedStickerItem);
      }
    };
    img.src = url;
  });
};

export const calculateTimeRangeFromTextSelection = (
  subtitle: SubtitleItem,
  selectionRange: { start: number, end: number }
): { startTime: number, endTime: number } => {
  const totalDuration = subtitle.endTime - subtitle.startTime;
  const totalTextLength = subtitle.text.length;
  
  if (totalTextLength === 0) {
    return {
      startTime: subtitle.startTime,
      endTime: subtitle.endTime
    };
  }
  
  const startRatio = Math.max(0, selectionRange.start / totalTextLength);
  const endRatio = Math.min(1, selectionRange.end / totalTextLength);
  
  return {
    startTime: subtitle.startTime + (totalDuration * startRatio),
    endTime: subtitle.startTime + (totalDuration * endRatio)
  };
};

export const isMediaVisibleAtTime = (item: PlacedMediaItem, currentTime: number): boolean => {
  const currentTimeMs = currentTime * 1000;
  return currentTimeMs >= item.position.startTime && currentTimeMs <= item.position.endTime;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const cleanupMediaUrl = (url: string): void => {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};