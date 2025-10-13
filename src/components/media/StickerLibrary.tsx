import { useState, useEffect } from 'react';
import { useMediaStore, useTrendingItems, useUploadedMedia } from '@/stores/useMediaStore';
import { StickerCard } from './StickerCard';
import type { StickerItem, UploadedStickerItem } from '@/types/media';
import type { SubtitleItem } from '@/types/subtitle';

interface StickerLibraryProps {
  currentSubtitle?: SubtitleItem | null;
}

export function StickerLibrary({ currentSubtitle }: StickerLibraryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { loadTrending } = useMediaStore();
  const trendingItems = useTrendingItems();
  const uploadedMedia = useUploadedMedia();
  
  const uploadedStickers = uploadedMedia.filter((item): item is UploadedStickerItem => item.type === 'sticker');
  const trendingStickers = trendingItems.filter((item): item is StickerItem => item.type === 'sticker');
  const allStickers = [...uploadedStickers, ...trendingStickers];
  const visibleStickers = isExpanded ? allStickers : allStickers.slice(0, 3);
  const hasMore = allStickers.length > 3;

  useEffect(() => {
    loadTrending('sticker');
  }, [loadTrending]);

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
        {visibleStickers.length > 0 ? (
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