import { useState } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useMediaStore } from '@/stores/useMediaStore';
import { calculateTimeRangeFromTextSelection } from '@/utils/mediaUtils';
import type { GifItem } from '@/types/media';

interface GifCardProps {
  gif: GifItem;
}

export function GifCard({ gif }: GifCardProps) {
  const [isApplied, setIsApplied] = useState(false);
  const { richTextSelection, editingSubtitleId } = useUIStore();
  const { subtitles } = useProjectStore();
  const { placeOnTimeline } = useMediaStore();
  
  const canInsert = Boolean(richTextSelection && editingSubtitleId);

  const handleClick = () => {
    if (!canInsert || !richTextSelection || !editingSubtitleId) return;

    const subtitle = subtitles.find(s => s.id === editingSubtitleId);
    if (!subtitle) return;

    const timeRange = calculateTimeRangeFromTextSelection(subtitle, {
      start: richTextSelection.startIndex,
      end: richTextSelection.endIndex
    });

    placeOnTimeline(gif, timeRange.startTime, timeRange.endTime);
    
    setIsApplied(true);
    setTimeout(() => setIsApplied(false), 1500);
  };

  return (
    <button
      onClick={handleClick}
      disabled={!canInsert}
      className={`
        relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200
        ${isApplied 
          ? 'border-green-500 shadow-lg shadow-green-500/20' 
          : canInsert 
            ? 'border-border-secondary hover:border-accent-purple hover:scale-105 cursor-pointer'
            : 'border-border-secondary opacity-50 cursor-not-allowed'
        }
      `}
    >
      <img 
        src={gif.url}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
      />
      
      {isApplied && (
        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
          <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">
            已添加
          </div>
        </div>
      )}
      
      {!canInsert && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="text-white text-xs text-center px-2">
            请先选择字幕文本
          </div>
        </div>
      )}
    </button>
  );
}