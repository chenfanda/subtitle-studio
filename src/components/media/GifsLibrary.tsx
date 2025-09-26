import { useState, useEffect } from 'react';
import { useMediaStore, useTrendingItems } from '@/stores/useMediaStore';
import { GifCard } from './GifCard';
import type { GifItem } from '@/types/media';
import type { SubtitleItem } from '@/types/subtitle';

interface GifsLibraryProps {
  currentSubtitle?: SubtitleItem | null;
}

export function GifsLibrary({ currentSubtitle }: GifsLibraryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { loadTrending } = useMediaStore();
  const trendingItems = useTrendingItems();
  
  const gifs = trendingItems.filter((item): item is GifItem => item.type === 'gif');
  const visibleGifs = isExpanded ? gifs : gifs.slice(0, 3);
  const hasMore = gifs.length > 3;

  useEffect(() => {
    loadTrending('gif');
  }, [loadTrending]);

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-text-primary">Giphy GIFS</h4>
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
        {visibleGifs.length > 0 ? (
          visibleGifs.map((gif) => (
            <GifCard key={gif.id} gif={gif} currentSubtitle={currentSubtitle} />
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