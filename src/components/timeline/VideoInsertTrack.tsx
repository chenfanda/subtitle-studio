import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';
import { useUIStore } from '@/stores/useUIStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { Video } from 'lucide-react';
import type { TimelineSegment } from '@/types/videoSequence';

export function VideoInsertTrack() {
  const segments = useVideoSequenceStore((state) => state.segments);
  const timelineZoom = useUIStore((state) => state.timelineZoom);
  const setCurrentTime = useProjectStore((state) => state.setCurrentTime);
  const setSelectedAttachment = useUIStore((state) => state.setSelectedAttachment);
  const pixelsPerMillisecond = timelineZoom / 1000;

  const handleClipClick = (segment: TimelineSegment) => {
    setCurrentTime(segment.globalStartTime / 1000);
    setSelectedAttachment({
      type: 'videoSequence',
      segmentId: segment.id
    });
  };

  return (
    <div className="flex h-9 border-b border-border-secondary">
      <div className="w-32 flex-shrink-0 flex items-center justify-center 
                    border-r border-border-secondary bg-bg-primary">
        <Video size={16} className="text-text-secondary" />
        <span className="ml-2 text-xs font-medium text-text-primary">
          视频序列
        </span>
      </div>

      <div className="flex-1 relative overflow-hidden bg-bg-tertiary">
        {segments.map((segment, index) => {
          const left = segment.globalStartTime * pixelsPerMillisecond;
          const width = segment.duration * pixelsPerMillisecond;

          const isMain = segment.type === 'main';

          return (
            <div
              key={segment.id}
              className={`
                absolute top-1/2 -translate-y-1/2 h-8 
                flex items-center px-2 rounded 
                cursor-pointer overflow-hidden
                ${isMain 
                  ? 'bg-blue-800/50 border border-blue-600' 
                  : 'bg-purple-800/50 border border-purple-600'}
              `}
              style={{
                left: `${left}px`,
                width: `${width}px`,
                minWidth: '2px',
              }}
              onClick={() => handleClipClick(segment)}
            >
              <span className="text-xs text-white font-medium truncate">
                {isMain ? `主片段 #${index + 1}` : `插入片段 #${index + 1}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}