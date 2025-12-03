import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Play, Pause } from 'lucide-react';
import { formatDuration } from '@/utils/audioUtils';
import type { BrollVideo } from '@/types/broll';

interface InsertVideoEditViewProps {
  video: BrollVideo;
  onBack: () => void;
  onApply: (range: { startTime: number; endTime: number }) => void;
}

export function InsertVideoEditView({ video, onBack, onApply }: InsertVideoEditViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(video.duration);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => setIsPlaying(false));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const curr = videoRef.current.currentTime;
      setCurrentTime(curr);

      if (curr >= endTime) {
        videoRef.current.currentTime = startTime;
        if (!isPlaying) {
            videoRef.current.pause();
        }
      }
    }
  };

  const handleRangeChange = (type: 'start' | 'end', value: string) => {
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return;

    if (type === 'start') {
        const newStart = Math.min(Math.max(0, numVal), endTime - 0.1);
        setStartTime(newStart);
        if (videoRef.current) videoRef.current.currentTime = newStart;
    } else {
        const newEnd = Math.max(Math.min(video.duration, numVal), startTime + 0.1);
        setEndTime(newEnd);
        if (videoRef.current) videoRef.current.currentTime = startTime; 
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
        if (!isPlaying && (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime)) {
            videoRef.current.currentTime = startTime;
        }
        setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border-secondary flex-shrink-0 flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">返回</span>
        </button>
        <h3 className="text-sm font-medium text-text-primary">剪辑素材</h3>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video border border-border-secondary group">
          <video
            ref={videoRef}
            src={video.url}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />
           <div 
             className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
             onClick={togglePlay}
           >
              {!isPlaying ? <Play size={48} className="text-white drop-shadow-lg"/> : <Pause size={48} className="text-white drop-shadow-lg"/>}
           </div>
        </div>

        <div className="space-y-6 px-2">
          <div className="relative h-2 bg-bg-tertiary rounded-full mt-2 overflow-hidden">
             <div 
               className="absolute top-0 bottom-0 bg-accent-purple/30"
               style={{ 
                 left: `${(startTime / video.duration) * 100}%`, 
                 right: `${100 - (endTime / video.duration) * 100}%` 
               }}
             />
             <div 
                className="absolute top-0 bottom-0 w-1 bg-white shadow z-10"
                style={{ left: `${(currentTime / video.duration) * 100}%` }}
             />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-xs text-text-secondary font-medium">开始时间 ({formatDuration(startTime)})</label>
                <input 
                    type="range" 
                    min={0} 
                    max={video.duration} 
                    step={0.1}
                    value={startTime}
                    onChange={(e) => handleRangeChange('start', e.target.value)}
                    className="w-full accent-accent-purple"
                />
                <div className="flex gap-2">
                    <input
                        type="number"
                        min={0}
                        max={endTime}
                        step={0.1}
                        value={startTime.toFixed(2)}
                        onChange={(e) => handleRangeChange('start', e.target.value)}
                        className="w-full px-2 py-1 bg-bg-tertiary rounded border border-border-primary text-xs"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs text-text-secondary font-medium">结束时间 ({formatDuration(endTime)})</label>
                <input 
                    type="range" 
                    min={0} 
                    max={video.duration} 
                    step={0.1}
                    value={endTime}
                    onChange={(e) => handleRangeChange('end', e.target.value)}
                    className="w-full accent-accent-purple"
                />
                <div className="flex gap-2">
                    <input
                        type="number"
                        min={startTime}
                        max={video.duration}
                        step={0.1}
                        value={endTime.toFixed(2)}
                        onChange={(e) => handleRangeChange('end', e.target.value)}
                        className="w-full px-2 py-1 bg-bg-tertiary rounded border border-border-primary text-xs"
                    />
                </div>
            </div>
          </div>
        </div>

        <div className="text-center p-2 bg-bg-tertiary rounded text-sm text-text-secondary">
          选定时长: <span className="text-accent-purple font-bold">{formatDuration(endTime - startTime)}</span>
        </div>

      </div>

      <div className="p-4 border-t border-border-secondary flex-shrink-0">
        <button
          onClick={() => onApply({ startTime, endTime })}
          className="w-full py-3 rounded-lg bg-accent-purple hover:bg-accent-purple/90 text-white font-medium transition-colors"
        >
          确认插入片段
        </button>
      </div>
    </div>
  );
}