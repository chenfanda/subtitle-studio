import { useBrollStore } from '@/stores/useBrollStore';
import { formatDuration } from '@/utils/audioUtils';
import type { BrollVideo } from '@/types/broll';

interface BrollCardProps {
  video: BrollVideo;
}

export function BrollCard({ video }: BrollCardProps) {
  const { selectedVideo, selectVideo } = useBrollStore();
  
  const isSelected = selectedVideo?.id === video.id;

  const handleCardClick = () => {
    selectVideo(video);
  };

  return (
    <button
      onClick={handleCardClick}
      className={`
        relative w-full aspect-video rounded-lg overflow-hidden
        border-2 transition-all duration-200 hover:scale-105
        ${isSelected 
          ? 'border-accent-purple shadow-lg shadow-accent-purple/20' 
          : 'border-border-secondary hover:border-border-primary'
        }
      `}
    >
      {/* 视频缩略图 */}
      <img 
        src={video.thumbnail} 
        alt={video.name}
        className="w-full h-full object-cover"
      />
      
      {/* 底部信息栏 */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
        <div className="text-xs text-white truncate">{video.name}</div>
        <div className="text-xs text-gray-300">{formatDuration(video.duration)}</div>
      </div>
      
      {/* 选中状态标记 */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-accent-purple rounded-full flex items-center justify-center">
          <span className="text-white text-sm">✓</span>
        </div>
      )}
    </button>
  );
}