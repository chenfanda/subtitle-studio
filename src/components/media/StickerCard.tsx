import { useState, useEffect } from 'react';
import { useMediaStore } from '@/stores/useMediaStore';
import type { StickerItem } from '@/types/media';
import type { SubtitleItem } from '@/types/subtitle';

interface StickerCardProps {
  sticker: StickerItem;
  currentSubtitle?: SubtitleItem | null;
}

export function StickerCard({ sticker, currentSubtitle }: StickerCardProps) {
  const [isApplied, setIsApplied] = useState(false);
  const [hasThisMedia, setHasThisMedia] = useState(false);
  const { placeOnTimeline, removeMedia, placedMedia } = useMediaStore();

  useEffect(() => {
    if (currentSubtitle) {
      const hasMedia = placedMedia.some(item => 
        item.media.url === sticker.preview &&
        item.position.startTime === currentSubtitle.startTime &&
        item.position.endTime === currentSubtitle.endTime
      );
      setHasThisMedia(hasMedia);
    } else {
      setHasThisMedia(false);
    }
  }, [currentSubtitle, placedMedia, sticker.preview]);

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!hasThisMedia && currentSubtitle) {
      placeOnTimeline(sticker, currentSubtitle.startTime, currentSubtitle.endTime);
      setIsApplied(true);
      setTimeout(() => setIsApplied(false), 1500);
    } else if (hasThisMedia && currentSubtitle) {
      const mediaToRemove = placedMedia.find(item =>
        item.media.url === sticker.preview &&
        item.position.startTime === currentSubtitle.startTime &&
        item.position.endTime === currentSubtitle.endTime
      );
      if (mediaToRemove) {
        removeMedia(mediaToRemove.media.id);
      }
    }
  };

  const getButtonText = () => {
    if (hasThisMedia) return '移除贴纸';
    if (isApplied) return '✓ 已应用';
    return '应用到字幕';
  };

  const getButtonStyle = () => {
    if (hasThisMedia) return 'bg-red-600 hover:bg-red-700 text-white';
    if (isApplied) return 'bg-green-600 text-white';
    return 'bg-accent-purple hover:bg-accent-purple/80 text-white';
  };

  return (
    <div className="relative group">
      <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-border-secondary hover:border-accent-purple transition-colors">
        <img 
          src={sticker.preview} 
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {hasThisMedia && (
          <div className="absolute top-1 left-1 w-3 h-3 bg-orange-500 rounded-full" />
        )}
        {isApplied && (
          <div className="absolute top-1 left-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        )}
        
        {currentSubtitle && (
          <div className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleApply}
              className={`w-full py-1 px-2 text-xs rounded transition-colors ${getButtonStyle()}`}
            >
              {getButtonText()}
            </button>
          </div>
        )}
        
        {!currentSubtitle && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-white text-xs text-center px-2">
              请先编辑字幕
            </div>
          </div>
        )}
      </div>
    </div>
  );
}