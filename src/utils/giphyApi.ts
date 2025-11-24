import type { MediaItem } from '@/types/media';

export interface SearchParams {
  q: string;
  limit: number;
  offset: number;
}

export interface SearchResult {
  items: MediaItem[];
  hasMore: boolean;
}

const generateMockId = () => `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createMockMediaItem = (type: 'sticker' | 'gif', index: number): MediaItem => ({
  id: generateMockId(),
  url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  preview: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  tags: ['mock', type, 'placeholder'],
  width: 200,
  height: 200,
  type
});

export const searchStickers = async (params: SearchParams): Promise<SearchResult> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const items = Array.from({ length: params.limit }, (_, i) => 
    createMockMediaItem('sticker', params.offset + i + 1)
  );
  
  return {
    items,
    hasMore: params.offset + params.limit < 100
  };
};

export const searchGifs = async (params: SearchParams): Promise<SearchResult> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const items = Array.from({ length: params.limit }, (_, i) => 
    createMockMediaItem('gif', params.offset + i + 1)
  );
  
  return {
    items,
    hasMore: params.offset + params.limit < 100
  };
};

export const getTrendingStickers = async (limit: number = 20): Promise<MediaItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return Array.from({ length: limit }, (_, i) => 
    createMockMediaItem('sticker', i + 1)
  );
};

export const getTrendingGifs = async (limit: number = 20): Promise<MediaItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return Array.from({ length: limit }, (_, i) => 
    createMockMediaItem('gif', i + 1)
  );
};