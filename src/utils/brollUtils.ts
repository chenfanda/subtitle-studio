import type { BrollVideo, BrollRecommendation, BrollPlacement } from '@/types/broll';
import type { SubtitleItem } from '@/types/subtitle';

export const generateBrollRecommendations = (subtitles: SubtitleItem[]): BrollRecommendation[] => {
  return subtitles.map(subtitle => {
    const keywords = extractKeywords(subtitle.text);
    const suggestions = mockBrollSearch(keywords);
    
    return {
      subtitleId: subtitle.id,
      keywords,
      suggestions
    };
  });
};

export const extractKeywords = (text: string): string[] => {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must']);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });
  
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
};

export const scoreBrollRelevance = (broll: BrollVideo, keywords: string[]): number => {
  let score = 0;
  const brollText = `${broll.name} ${broll.tags.join(' ')}`.toLowerCase();
  
  keywords.forEach(keyword => {
    if (brollText.includes(keyword)) {
      score += keyword.length > 4 ? 3 : 2;
    }
    
    broll.tags.forEach(tag => {
      if (tag.toLowerCase() === keyword) score += 5;
      else if (tag.toLowerCase().includes(keyword)) score += 3;
    });
  });
  
  return score;
};

export const searchBrollVideos = async (query: string, limit: number = 10): Promise<BrollVideo[]> => {
  // Mock implementation - in real app, this would call actual B-roll API
  return mockBrollSearch([query]).slice(0, limit);
};

export const filterBrollByDuration = (videos: BrollVideo[], minDuration: number, maxDuration: number): BrollVideo[] => {
  return videos.filter(video => 
    video.duration >= minDuration && video.duration <= maxDuration
  );
};

export const createBrollPlacement = (
  broll: BrollVideo,
  startTime: number,
  duration: number,
  volume: number = 0.3
): BrollPlacement => {
  return {
    brollVideo: broll,
    startTime,
    endTime: startTime + duration,
    volume
  };
};

export const optimizeBrollForSubtitle = (
  broll: BrollVideo,
  subtitle: SubtitleItem,
  paddingBefore: number = 500,
  paddingAfter: number = 500
): BrollPlacement => {
  const startTime = subtitle.startTime - paddingBefore;
  const endTime = subtitle.endTime + paddingAfter;
  const duration = endTime - startTime;
  
  return createBrollPlacement(broll, Math.max(0, startTime), duration);
};

export const validateBrollFile = (file: File): boolean => {
  const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  const maxSize = 100 * 1024 * 1024; // 100MB
  
  return validTypes.includes(file.type) && file.size <= maxSize;
};

export const getBrollDuration = (url: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      resolve(video.duration);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = url;
  });
};

export const generateBrollThumbnail = (videoUrl: string, timeOffset: number = 1): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    video.onloadeddata = () => {
      video.currentTime = Math.min(timeOffset, video.duration / 2);
    };
    
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    
    video.onerror = reject;
    video.src = videoUrl;
  });
};

export const analyzeSceneContent = (subtitles: SubtitleItem[]): { themes: string[]; mood: string; context: string } => {
  const allText = subtitles.map(s => s.text).join(' ').toLowerCase();
  
  const themes = extractThemes(allText);
  const mood = analyzeMood(allText);
  const context = analyzeContext(allText);
  
  return { themes, mood, context };
};

export const sortBrollByRelevance = (videos: BrollVideo[], keywords: string[]): BrollVideo[] => {
  return [...videos]
    .map(video => ({
      ...video,
      relevanceScore: scoreBrollRelevance(video, keywords)
    }))
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
};

export const trimBrollToFit = (placement: BrollPlacement, maxDuration: number): BrollPlacement => {
  const currentDuration = placement.endTime - placement.startTime;
  
  if (currentDuration <= maxDuration) return placement;
  
  return {
    ...placement,
    endTime: placement.startTime + maxDuration
  };
};

const mockBrollSearch = (keywords: string[]): BrollVideo[] => {
  const mockVideos: BrollVideo[] = [
    {
      id: 'broll_1',
      name: 'City Traffic',
      url: '/broll/city-traffic.mp4',
      thumbnail: '/broll/thumbs/city-traffic.jpg',
      duration: 30,
      tags: ['city', 'traffic', 'urban', 'cars', 'street']
    },
    {
      id: 'broll_2',
      name: 'Ocean Waves',
      url: '/broll/ocean-waves.mp4',
      thumbnail: '/broll/thumbs/ocean-waves.jpg',
      duration: 45,
      tags: ['ocean', 'waves', 'water', 'nature', 'peaceful']
    },
    {
      id: 'broll_3',
      name: 'Coffee Shop',
      url: '/broll/coffee-shop.mp4',
      thumbnail: '/broll/thumbs/coffee-shop.jpg',
      duration: 25,
      tags: ['coffee', 'cafe', 'people', 'indoor', 'social']
    }
  ];
  
  return sortBrollByRelevance(mockVideos, keywords);
};

const extractThemes = (text: string): string[] => {
  const themeKeywords = {
    technology: ['tech', 'computer', 'digital', 'software', 'app', 'internet'],
    nature: ['nature', 'tree', 'forest', 'ocean', 'mountain', 'sky'],
    business: ['business', 'office', 'meeting', 'company', 'work', 'professional'],
    lifestyle: ['life', 'home', 'family', 'friends', 'leisure', 'hobby']
  };
  
  const themes: string[] = [];
  Object.entries(themeKeywords).forEach(([theme, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      themes.push(theme);
    }
  });
  
  return themes;
};

const analyzeMood = (text: string): string => {
  const moodKeywords = {
    positive: ['happy', 'good', 'great', 'awesome', 'wonderful', 'amazing'],
    negative: ['bad', 'terrible', 'awful', 'sad', 'disappointed', 'frustrated'],
    neutral: ['okay', 'normal', 'regular', 'standard', 'typical']
  };
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  moodKeywords.positive.forEach(keyword => {
    if (text.includes(keyword)) positiveCount++;
  });
  
  moodKeywords.negative.forEach(keyword => {
    if (text.includes(keyword)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

const analyzeContext = (text: string): string => {
  if (text.includes('office') || text.includes('work') || text.includes('meeting')) return 'professional';
  if (text.includes('home') || text.includes('family') || text.includes('personal')) return 'personal';
  if (text.includes('outdoor') || text.includes('nature') || text.includes('travel')) return 'outdoor';
  return 'general';
};