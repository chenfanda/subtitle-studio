import { useState, useEffect } from 'react';
import { getTrendingStickers } from '@/utils/giphyApi';
import { useUploadedMedia } from '@/stores/useMediaStore';
import { StickerCard } from './StickerCard';
import type { StickerItem, MediaItem, UploadedStickerItem } from '@/types/media';
import type { SubtitleItem } from '@/types/subtitle';

interface StickerLibraryProps {
  currentSubtitle?: SubtitleItem | null;
}

export function StickerLibrary({ currentSubtitle }: StickerLibraryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [trendingStickers, setTrendingStickers] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const uploadedMedia = useUploadedMedia();
  const uploadedStickers = uploadedMedia.filter((item): item is UploadedStickerItem => item.type === 'sticker');
  
  // 合并上传的贴纸和热门贴纸
  const allStickers = [...uploadedStickers, ...trendingStickers];
  const visibleStickers = isExpanded ? allStickers : allStickers.slice(0, 3);
  const hasMore = allStickers.length > 3;

  useEffect(() => {
    const loadStickers = async () => {
      try {
        setIsLoading(true);
        const stickerData = await getTrendingStickers(20);
        setTrendingStickers(stickerData);
      } catch (error) {
        console.error('Failed to load stickers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStickers();
  }, []);

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-text-primary">Giphy Sticker</h4>
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-accent-purple hover:text-accent-purple/80 transition-colors"
          >
            查看更多
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {isLoading && uploadedStickers.length === 0 ? (
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="aspect-square bg-bg-tertiary rounded animate-pulse" />
          ))
        ) : visibleStickers.length > 0 ? (
          visibleStickers.map((sticker) => (
            <StickerCard key={sticker.id} sticker={sticker as StickerItem} currentSubtitle={currentSubtitle} />
          ))
        ) : (
          <div className="aspect-square bg-bg-tertiary rounded border-2 border-dashed border-border-secondary flex items-center justify-center text-text-tertiary text-xl">
            +
          </div>
        )}
      </div>
    </div>
  );
}