import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';
import { useUIStore } from '@/stores/useUIStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { Video } from 'lucide-react';

export function VideoInsertTrack() {
  const clips = useVideoSequenceStore((state) => state.clips);
  const timelineZoom = useUIStore((state) => state.timelineZoom);
  const setCurrentTime = useProjectStore((state) => state.setCurrentTime);

  const pixelsPerMillisecond = timelineZoom / 1000;

  const handleClipClick = (clip: typeof clips[0]) => {
    setCurrentTime(clip.insertAtTime / 1000);
  };

  return (
    <div className="flex h-9 border-b border-border-secondary">
      <div className="w-32 flex-shrink-0 flex items-center justify-center 
                    border-r border-border-secondary bg-bg-primary">
        <Video size={16} className="text-text-secondary" />
        <span className="ml-2 text-xs font-medium text-text-primary">
          视频插入
        </span>
      </div>

      <div className="flex-1 relative overflow-hidden bg-bg-tertiary">
        {clips.map((clip, index) => {
          const left = clip.insertAtTime * pixelsPerMillisecond;
          const width = clip.duration * pixelsPerMillisecond;

          return (
            <div
              key={clip.id}
              className="
                absolute top-1/2 -translate-y-1/2 h-8 
                flex items-center px-2 rounded 
                bg-blue-800/50 border border-blue-600 
                cursor-pointer overflow-hidden
              "
              style={{
                left: `${left}px`,
                width: `${width}px`,
                minWidth: '2px',
              }}
              onClick={() => handleClipClick(clip)}
            >
              <span className="text-xs text-white font-medium truncate">
                片段 #{index + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}