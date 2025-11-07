import { ArrowLeft } from 'lucide-react';
import { formatDuration } from '@/utils/audioUtils';
import type { BrollVideo } from '@/types/broll';

interface InsertVideoEditViewProps {
  video: BrollVideo;
  onBack: () => void;
  onApply: () => void;
}

export function InsertVideoEditView({ video, onBack, onApply }: InsertVideoEditViewProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border-secondary flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">返回</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="relative">
          <div className="aspect-video rounded-lg overflow-hidden border-2 border-border-secondary">
            <img
              src={video.thumbnail}
              alt={video.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="mt-2 text-sm">
            <div className="text-text-primary font-medium truncate">
              {video.name}
            </div>
            <div className="text-text-secondary">
              时长: {formatDuration(video.duration)}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border-secondary flex-shrink-0">
        <button
          onClick={onApply}
          className="w-full py-3 rounded-lg bg-accent-purple hover:bg-accent-purple/90 text-white font-medium transition-colors"
        >
          应用
        </button>
      </div>
    </div>
  );
}