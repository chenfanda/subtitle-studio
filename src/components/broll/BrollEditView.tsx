import { useBrollStore } from '@/stores/useBrollStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { BrollTransitionSelector } from './BrollTransitionSelector';
import { formatDuration } from '@/utils/audioUtils';

interface BrollEditViewProps {
  onApply: () => void;
  targetSubtitleId: string;
}

export function BrollEditView({ onApply, targetSubtitleId }: BrollEditViewProps) {
  const { selectedVideo, setDialogView } = useBrollStore();
  const { removeSubtitleBroll } = useSubtitleStore();

  if (!selectedVideo) return null;

  const handleBack = () => {
    setDialogView('search');
  };

  const handleDelete = () => {
    removeSubtitleBroll(targetSubtitleId);
    setDialogView('search');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border-secondary flex-shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <span className="text-lg">←</span>
          <span className="text-sm">返回</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="relative">
          <div className="aspect-video rounded-lg overflow-hidden border-2 border-border-secondary">
            <img
              src={selectedVideo.thumbnail}
              alt={selectedVideo.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors"
            title="删除B-roll"
          >
            🗑️
          </button>

          <div className="mt-2 text-sm">
            <div className="text-text-primary font-medium truncate">
              {selectedVideo.name}
            </div>
            <div className="text-text-secondary">
              时长: {formatDuration(selectedVideo.duration)}
            </div>
          </div>
        </div>

        <BrollTransitionSelector />
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