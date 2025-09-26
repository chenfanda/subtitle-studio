import { useMemo } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { usePlacedMedia } from '@/stores/useMediaStore';
import { isMediaVisibleAtTime } from '@/utils/mediaUtils';
import { MediaElement } from '../media/MediaElement';

export function MediaOverlay() {
  const { currentTime } = useProjectStore();
  const placedMedia = usePlacedMedia();
  
  const visibleMedia = useMemo(() => {
    return placedMedia.filter(item => 
      (item.media.type === 'sticker' || item.media.type === 'gif') && 
      isMediaVisibleAtTime(item, currentTime)
    );
  }, [placedMedia, currentTime]);

  if (visibleMedia.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {visibleMedia.map(item => (
        <MediaElement 
          key={item.media.id}
          item={item}
        />
      ))}
    </div>
  );
}