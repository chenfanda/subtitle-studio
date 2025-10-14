export interface MediaItem {
  id: string;
  url: string;
  preview: string;
  tags: string[];
  width: number;
  height: number;
  type: 'sticker' | 'gif';
}

export interface StickerItem extends MediaItem {
  type: 'sticker';
}

export interface GifItem extends MediaItem {
  type: 'gif';
}

export interface UploadedStickerItem extends StickerItem {
  isCustom: true;
  uploadedAt: Date;
  fileName: string;
  fileSize: number;
}

export interface UploadedGifItem extends GifItem {
  isCustom: true;
  uploadedAt: Date;
  fileName: string;
  fileSize: number;
}

export type UploadedMediaItem = UploadedStickerItem | UploadedGifItem;

export interface MediaPosition {
  x: number;
  y: number;
  scaleX: number;     // ✅ 修改：从 scale 拆分为 scaleX
  scaleY: number;     // ✅ 新增：独立的纵向缩放
  rotation: number;
  startTime: number;
  endTime: number;
}

export interface PlacedMediaItem {
  media: MediaItem;
  position: MediaPosition;
}