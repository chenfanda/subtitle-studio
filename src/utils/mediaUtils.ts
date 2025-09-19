import type { MediaItem, StickerItem, GifItem, MediaPosition, PlacedMediaItem } from '@/types/media';

export const resizeMediaItem = (item: MediaItem, maxWidth: number, maxHeight: number): { width: number; height: number } => {
  const aspectRatio = item.width / item.height;
  let newWidth = item.width;
  let newHeight = item.height;

  if (newWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = newWidth / aspectRatio;
  }

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }

  return { width: Math.round(newWidth), height: Math.round(newHeight) };
};

export const calculateMediaPosition = (
  item: MediaItem, 
  containerWidth: number, 
  containerHeight: number, 
  position: MediaPosition
): { x: number; y: number; width: number; height: number } => {
  const scaledWidth = item.width * position.scale;
  const scaledHeight = item.height * position.scale;
  
  const x = (containerWidth * position.x / 100) - (scaledWidth / 2);
  const y = (containerHeight * position.y / 100) - (scaledHeight / 2);
  
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(scaledWidth),
    height: Math.round(scaledHeight)
  };
};

export const validateMediaFile = (file: File): boolean => {
  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  return validImageTypes.includes(file.type) && file.size <= maxSize;
};

export const createMediaFromFile = async (file: File): Promise<MediaItem> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const mediaItem: MediaItem = {
        id: generateMediaId(),
        url,
        preview: url,
        tags: [file.name.split('.')[0]],
        width: img.width,
        height: img.height
      };
      
      URL.revokeObjectURL(url);
      resolve(mediaItem);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

export const optimizeMediaForWeb = (item: MediaItem, maxWidth: number = 800): MediaItem => {
  if (item.width <= maxWidth) return item;
  
  const aspectRatio = item.width / item.height;
  const optimizedWidth = maxWidth;
  const optimizedHeight = Math.round(maxWidth / aspectRatio);
  
  return {
    ...item,
    width: optimizedWidth,
    height: optimizedHeight
  };
};

export const createStickerFromGiphy = (giphyData: any): StickerItem => {
  return {
    id: giphyData.id,
    type: 'sticker',
    url: giphyData.images.original.url,
    preview: giphyData.images.fixed_height_small.url,
    tags: giphyData.tags ? giphyData.tags.split(', ') : [],
    width: parseInt(giphyData.images.original.width),
    height: parseInt(giphyData.images.original.height)
  };
};

export const createGifFromGiphy = (giphyData: any): GifItem => {
  return {
    id: giphyData.id,
    type: 'gif',
    url: giphyData.images.original.url,
    preview: giphyData.images.fixed_height.url,
    tags: giphyData.tags ? giphyData.tags.split(', ') : [],
    width: parseInt(giphyData.images.original.width),
    height: parseInt(giphyData.images.original.height)
  };
};

export const getMediaDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = url;
  });
};

export const createMediaPlacement = (
  media: MediaItem, 
  startTime: number, 
  endTime: number,
  x: number = 50,
  y: number = 50,
  scale: number = 1
): PlacedMediaItem => {
  return {
    media,
    position: {
      x,
      y,
      scale,
      rotation: 0,
      startTime,
      endTime
    }
  };
};

export const updateMediaPosition = (
  placement: PlacedMediaItem, 
  updates: Partial<MediaPosition>
): PlacedMediaItem => {
  return {
    ...placement,
    position: {
      ...placement.position,
      ...updates
    }
  };
};

export const isMediaVisible = (placement: PlacedMediaItem, currentTime: number): boolean => {
  return currentTime >= placement.position.startTime && currentTime <= placement.position.endTime;
};

export const filterMediaByTags = (items: MediaItem[], tags: string[]): MediaItem[] => {
  if (tags.length === 0) return items;
  
  return items.filter(item => 
    tags.some(tag => 
      item.tags.some(itemTag => 
        itemTag.toLowerCase().includes(tag.toLowerCase())
      )
    )
  );
};

export const sortMediaByRelevance = (items: MediaItem[], searchTerm: string): MediaItem[] => {
  if (!searchTerm) return items;
  
  const searchLower = searchTerm.toLowerCase();
  
  return [...items].sort((a, b) => {
    const aScore = calculateRelevanceScore(a, searchLower);
    const bScore = calculateRelevanceScore(b, searchLower);
    return bScore - aScore;
  });
};

export const compressImageQuality = (canvas: HTMLCanvasElement, quality: number = 0.8): string => {
  return canvas.toDataURL('image/jpeg', quality);
};

const generateMediaId = (): string => {
  return `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const calculateRelevanceScore = (item: MediaItem, searchTerm: string): number => {
  let score = 0;
  
  item.tags.forEach(tag => {
    const tagLower = tag.toLowerCase();
    if (tagLower === searchTerm) score += 10;
    else if (tagLower.includes(searchTerm)) score += 5;
    else if (searchTerm.includes(tagLower)) score += 3;
  });
  
  return score;
};