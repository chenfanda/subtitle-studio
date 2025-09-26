import { useEffect } from 'react';
import { useMediaStore, useTrendingItems, useSearchResults, useUploadedMedia } from '@/stores/useMediaStore';
import { StickerCard } from './StickerCard';
import { MediaUpload } from './MediaUpload';
import type { StickerItem, UploadedStickerItem } from '@/types/media';

export function StickerLibrary() {
  const { 
    searchState,
    loadTrending,
    loadMoreResults
  } = useMediaStore();
  
  const searchResults = useSearchResults();
  const trendingItems = useTrendingItems();
  const uploadedMedia = useUploadedMedia();

  const hasSearchQuery = Boolean(searchState.query);
  const allStickers = hasSearchQuery ? searchResults : trendingItems;
  const stickers = allStickers.filter((item): item is StickerItem => item.type === 'sticker');
  const uploadedStickers = uploadedMedia.filter((item): item is UploadedStickerItem => item.type === 'sticker');

  useEffect(() => {
    if (!hasSearchQuery) {
      loadTrending('sticker');
    }
  }, [hasSearchQuery, loadTrending]);

  const handleLoadMore = () => {
    if (hasSearchQuery && searchState.hasMore && !searchState.isLoading) {
      loadMoreResults();
    }
  };

  return (
    <div className="p-4 space-y-4">
      {!hasSearchQuery && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text-primary">上传贴纸</h4>
          <MediaUpload />
          
          {uploadedStickers.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {uploadedStickers.map((sticker) => (
                <StickerCard key={sticker.id} sticker={sticker} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-text-primary">
            {hasSearchQuery ? `搜索结果: ${searchState.query}` : '热门贴纸'}
          </h4>
          {hasSearchQuery && (
            <span className="text-xs text-text-tertiary">
              {stickers.length} 项
            </span>
          )}
        </div>
        
        {stickers.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              {stickers.map((sticker) => (
                <StickerCard key={sticker.id} sticker={sticker} />
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
            <div className="text-2xl mb-2">🎭</div>
            <div className="text-sm">
              {hasSearchQuery ? '没有找到相关贴纸' : '暂无贴纸'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}