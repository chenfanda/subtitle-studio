export interface MediaItem {
  id: string;
  url: string;
  preview: string;
  tags: string[];
  width: number;
  height: number;
}

export interface StickerItem extends MediaItem {
  type: 'sticker';
}

export interface GifItem extends MediaItem {
  type: 'gif';
}

export interface MediaPosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  startTime: number;
  endTime: number;
}

export interface PlacedMediaItem {
  media: MediaItem;
  position: MediaPosition;
}