import { useEffect } from 'react';
import { useMediaStore, useTrendingItems, useSearchResults } from '@/stores/useMediaStore';
import { GifCard } from './GifCard';
import type { GifItem } from '@/types/media';

export function GifsLibrary() {
  const { 
    searchState,
    loadTrending,
    loadMoreResults
  } = useMediaStore();
  
  const searchResults = useSearchResults();
  const trendingItems = useTrendingItems();

  const hasSearchQuery = Boolean(searchState.query);
  const allGifs = hasSearchQuery ? searchResults : trendingItems;
  const gifs = allGifs.filter((item): item is GifItem => item.type === 'gif');

  useEffect(() => {
    if (!hasSearchQuery) {
      loadTrending('gif');
    }
  }, [hasSearchQuery, loadTrending]);

  const handleLoadMore = () => {
    if (hasSearchQuery && searchState.hasMore && !searchState.isLoading) {
      loadMoreResults();
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-text-primary">
            {hasSearchQuery ? `搜索结果: ${searchState.query}` : '热门GIF'}
          </h4>
          {hasSearchQuery && (
            <span className="text-xs text-text-tertiary">
              {gifs.length} 项
            </span>
          )}
        </div>
        
        {gifs.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              {gifs.map((gif) => (
                <GifCard key={gif.id} gif={gif} />
              ))}
            </div>
            
            {hasSearchQuery && searchState.hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={searchState.isLoading}
                  className="px-4 py-2 text-sm bg-bg-secondary hover:bg-bg-elevated disabled:bg-bg-secondary text-text-primary rounded transition-colors"
                >
                  {searchState.isLoading ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-text-tertiary">
            <div className="text-2xl mb-2">🎬</div>
            <div className="text-sm">
              {hasSearchQuery ? '没有找到相关GIF' : '暂无GIF'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}