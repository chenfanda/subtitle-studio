import { createStickerFromGiphy, createGifFromGiphy } from './mediaUtils';
import type { StickerItem, GifItem } from '@/types/media';

// Giphy API 配置
const GIPHY_CONFIG = {
  baseUrl: 'https://api.giphy.com/v1',
  apiKey: process.env.VITE_GIPHY_API_KEY || 'YOUR_GIPHY_API_KEY_HERE',
  limit: 25,
  rating: 'g',
  lang: 'en'
} as const;

interface GiphyResponse {
  data: any[];
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
  meta: {
    status: number;
    msg: string;
    response_id: string;
  };
}

interface GiphySearchParams {
  q: string;
  limit?: number;
  offset?: number;
  rating?: string;
  lang?: string;
}

export const searchStickers = async (params: GiphySearchParams): Promise<{ items: StickerItem[]; totalCount: number }> => {
  const searchParams = new URLSearchParams({
    api_key: GIPHY_CONFIG.apiKey,
    q: params.q,
    limit: (params.limit || GIPHY_CONFIG.limit).toString(),
    offset: (params.offset || 0).toString(),
    rating: params.rating || GIPHY_CONFIG.rating,
    lang: params.lang || GIPHY_CONFIG.lang
  });

  const response = await fetch(`${GIPHY_CONFIG.baseUrl}/stickers/search?${searchParams}`);
  
  if (!response.ok) {
    throw new Error(`Giphy API error: ${response.status} ${response.statusText}`);
  }

  const data: GiphyResponse = await response.json();
  
  return {
    items: data.data.map(createStickerFromGiphy),
    totalCount: data.pagination.total_count
  };
};

export const searchGifs = async (params: GiphySearchParams): Promise<{ items: GifItem[]; totalCount: number }> => {
  const searchParams = new URLSearchParams({
    api_key: GIPHY_CONFIG.apiKey,
    q: params.q,
    limit: (params.limit || GIPHY_CONFIG.limit).toString(),
    offset: (params.offset || 0).toString(),
    rating: params.rating || GIPHY_CONFIG.rating,
    lang: params.lang || GIPHY_CONFIG.lang
  });

  const response = await fetch(`${GIPHY_CONFIG.baseUrl}/gifs/search?${searchParams}`);
  
  if (!response.ok) {
    throw new Error(`Giphy API error: ${response.status} ${response.statusText}`);
  }

  const data: GiphyResponse = await response.json();
  
  return {
    items: data.data.map(createGifFromGiphy),
    totalCount: data.pagination.total_count
  };
};

export const getTrendingStickers = async (limit: number = GIPHY_CONFIG.limit): Promise<StickerItem[]> => {
  const searchParams = new URLSearchParams({
    api_key: GIPHY_CONFIG.apiKey,
    limit: limit.toString(),
    rating: GIPHY_CONFIG.rating
  });

  const response = await fetch(`${GIPHY_CONFIG.baseUrl}/stickers/trending?${searchParams}`);
  
  if (!response.ok) {
    throw new Error(`Giphy API error: ${response.status} ${response.statusText}`);
  }

  const data: GiphyResponse = await response.json();
  return data.data.map(createStickerFromGiphy);
};

export const getTrendingGifs = async (limit: number = GIPHY_CONFIG.limit): Promise<GifItem[]> => {
  const searchParams = new URLSearchParams({
    api_key: GIPHY_CONFIG.apiKey,
    limit: limit.toString(),
    rating: GIPHY_CONFIG.rating
  });

  const response = await fetch(`${GIPHY_CONFIG.baseUrl}/gifs/trending?${searchParams}`);
  
  if (!response.ok) {
    throw new Error(`Giphy API error: ${response.status} ${response.statusText}`);
  }

  const data: GiphyResponse = await response.json();
  return data.data.map(createGifFromGiphy);
};

export const getStickerById = async (id: string): Promise<StickerItem | null> => {
  const searchParams = new URLSearchParams({
    api_key: GIPHY_CONFIG.apiKey
  });

  const response = await fetch(`${GIPHY_CONFIG.baseUrl}/stickers/${id}?${searchParams}`);
  
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Giphy API error: ${response.status} ${response.statusText}`);
  }

  const data: GiphyResponse = await response.json();
  return data.data ? createStickerFromGiphy(data.data) : null;
};

export const getGifById = async (id: string): Promise<GifItem | null> => {
  const searchParams = new URLSearchParams({
    api_key: GIPHY_CONFIG.apiKey
  });

  const response = await fetch(`${GIPHY_CONFIG.baseUrl}/gifs/${id}?${searchParams}`);
  
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Giphy API error: ${response.status} ${response.statusText}`);
  }

  const data: GiphyResponse = await response.json();
  return data.data ? createGifFromGiphy(data.data) : null;
};

export const getRandomSticker = async (tag?: string): Promise<StickerItem | null> => {
  const searchParams = new URLSearchParams({
    api_key: GIPHY_CONFIG.apiKey,
    rating: GIPHY_CONFIG.rating
  });

  if (tag) {
    searchParams.append('tag', tag);
  }

  const response = await fetch(`${GIPHY_CONFIG.baseUrl}/stickers/random?${searchParams}`);
  
  if (!response.ok) {
    throw new Error(`Giphy API error: ${response.status} ${response.statusText}`);
  }

  const data: GiphyResponse = await response.json();
  return data.data ? createStickerFromGiphy(data.data) : null;
};

export const getRandomGif = async (tag?: string): Promise<GifItem | null> => {
  const searchParams = new URLSearchParams({
    api_key: GIPHY_CONFIG.apiKey,
    rating: GIPHY_CONFIG.rating
  });

  if (tag) {
    searchParams.append('tag', tag);
  }

  const response = await fetch(`${GIPHY_CONFIG.baseUrl}/gifs/random?${searchParams}`);
  
  if (!response.ok) {
    throw new Error(`Giphy API error: ${response.status} ${response.statusText}`);
  }

  const data: GiphyResponse = await response.json();
  return data.data ? createGifFromGiphy(data.data) : null;
};

export const validateGiphyApiKey = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${GIPHY_CONFIG.baseUrl}/gifs/trending?api_key=${GIPHY_CONFIG.apiKey}&limit=1`);
    return response.ok;
  } catch {
    return false;
  }
};

export const buildGiphyUrl = (endpoint: string, params: Record<string, string>): string => {
  const searchParams = new URLSearchParams({
    api_key: GIPHY_CONFIG.apiKey,
    ...params
  });
  
  return `${GIPHY_CONFIG.baseUrl}/${endpoint}?${searchParams}`;
};

export const handleGiphyError = (error: any): string => {
  if (error.message?.includes('404')) {
    return 'Content not found';
  }
  if (error.message?.includes('403')) {
    return 'API key invalid or rate limit exceeded';
  }
  if (error.message?.includes('429')) {
    return 'Too many requests, please try again later';
  }
  return 'Failed to load content from Giphy';
};