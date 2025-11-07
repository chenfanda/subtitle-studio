import { formatDuration } from '@/utils/audioUtils';
import type { BrollVideo } from '@/types/broll';

interface InsertVideoCardProps {
  video: BrollVideo;
  isSelected: boolean;
  onClick: () => void;
}

export function InsertVideoCard({ video, isSelected, onClick }: InsertVideoCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full aspect-video rounded-lg overflow-hidden
        border-2 transition-all duration-200 hover:scale-105
        ${isSelected 
          ? 'border-accent-purple shadow-lg shadow-accent-purple/20' 
          : 'border-border-secondary hover:border-border-primary'
        }
      `}
    >
      <img 
        src={video.thumbnail} 
        alt={video.name}
        className="w-full h-full object-cover"
      />
      
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
        <div className="text-xs text-white truncate">{video.name}</div>
        <div className="text-xs text-gray-300">{formatDuration(video.duration)}</div>
      </div>
      
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-accent-purple rounded-full flex items-center justify-center">
          <span className="text-white text-sm">✓</span>
        </div>
      )}
    </button>
  );
}