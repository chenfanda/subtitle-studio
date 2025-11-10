import { VideoOff } from 'lucide-react';
import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';
import { useUIStore } from '@/stores/useUIStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTimelineStore } from '@/stores/useTimelineStore';
import type { TimelineSegment } from '@/types/videoSequence';

export function VideoInsertTrack() {
  const segments = useVideoSequenceStore((state) => state.segments);
  const { pixelsPerSecond, scrollPosition } = useTimelineStore();
  const { setGlobalTime } = useProjectStore();
  const { setSelectedAttachment, selectedAttachment } = useUIStore();

  const displaySegments = segments.filter(
    s => s.type === 'insert' || s.type === 'cut'
  );

  const handleClipClick = (segment: TimelineSegment) => {
    setGlobalTime(segment.globalStartTime / 1000);
    setSelectedAttachment({
      type: 'videoSequence',
      segmentId: segment.id
    });
  };

  return (
    <div className="h-full bg-bg-tertiary relative overflow-hidden">
      <div 
        className="relative h-full w-full flex items-center"
        style={{ transform: `translateX(-${scrollPosition}px)` }}
      >
        {displaySegments.map((segment) => {
          const left = (segment.globalStartTime / 1000) * pixelsPerSecond;
          const width = (segment.duration / 1000) * pixelsPerSecond;
          const isSelected = selectedAttachment?.type === 'videoSequence' && selectedAttachment?.segmentId === segment.id;

          const isInsert = segment.type === 'insert';
          const isCut = segment.type === 'cut';

          const cutStyle = `
            bg-red-800/30 border border-red-600/70
            bg-[repeating-linear-gradient(
              45deg,
              rgba(255,255,255,0.05),
              rgba(255,255,255,0.05) 10px,
              transparent 10px,
              transparent 20px
            )]
          `;
          
          const insertStyle = 'bg-purple-800/50 border border-purple-600';

          return (
            <div
              key={segment.id}
              className={`
                absolute top-1/2 -translate-y-1/2 h-8 
                flex items-center px-2 rounded 
                cursor-pointer overflow-hidden box-border
                ${isInsert ? insertStyle : ''}
                ${isCut ? cutStyle : ''}
                ${isSelected ? (isInsert ? 'ring-2 ring-purple-400' : 'ring-2 ring-red-400') : ''}
              `}
              style={{
                left: `${left}px`,
                width: `${width}px`,
                minWidth: '2px',
              }}
              onClick={() => handleClipClick(segment)}
              title={isInsert ? `插入片段` : '跳播片段 (点击选中后可在播放器控件处删除)'}
            >
              {isInsert && (
                <span className="text-xs text-white font-medium truncate">
                  {`插入片段`}
                </span>
              )}
              {isCut && (
                <div className="w-full h-full flex items-center justify-center text-red-300/80">
                  <VideoOff size={14} /> 
                  <span className="text-xs font-medium truncate ml-1">跳播</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}