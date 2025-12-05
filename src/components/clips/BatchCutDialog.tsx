import { useState, useRef, useMemo } from 'react';
import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';
import { X, Play, Scissors, CheckCircle, Pause } from 'lucide-react';

interface CutSegment {
  id: string;
  start: number;
  end: number;
  isAdded: boolean;
}

export function BatchCutDialog({ onClose }: { onClose: () => void }) {
  const { segments, addCutMarker } = useVideoSequenceStore();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(5);
  const [cutList, setCutList] = useState<CutSegment[]>([]);

  const mainVideoUrl = useMemo(() => {
    return segments.find(s => s.type === 'main')?.sourceUrl || '';
  }, [segments]);

  // [新增] 核心逻辑：检查并跳过剪切区间
  // 输入一个时间点，如果该时间点在剪切区间内，返回区间的结束时间；否则返回原时间
  const checkSkipTime = (time: number) => {
    // 找到包含当前时间的剪切区间
    const insideCut = cutList.find(cut => time >= cut.start && time < cut.end);
    if (insideCut) {
      return insideCut.end;
    }
    return time;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const rawTime = videoRef.current.currentTime;
      // 1. 计算是否需要跳跃
      const validTime = checkSkipTime(rawTime);
      
      // 2. 如果计算出的时间与当前物理时间不一致（说明触发了跳跃），强制设置视频时间
      // 使用 0.05 的阈值避免浮点数抖动
      if (Math.abs(validTime - rawTime) > 0.05) {
         videoRef.current.currentTime = validTime;
         setCurrentTime(validTime);
      } else {
         setCurrentTime(rawTime);
      }

      if (videoRef.current.ended) {
        setIsPlaying(false);
      }
    }
  };

  // ... (handleSetStart, handleSetEnd, checkOverlap, handleAddCutToList 保持不变) ...
  const handleSetStart = () => {
    const newStart = currentTime;
    let newEnd = rangeEnd;
    if (newEnd <= newStart) {
        newEnd = Math.min(newStart + 5, duration);
    }
    setRangeStart(newStart);
    setRangeEnd(newEnd);
  };

  const handleSetEnd = () => {
    const newEnd = currentTime;
    let newStart = rangeStart;
    if (newStart >= newEnd) {
        newStart = Math.max(0, newEnd - 5);
    }
    setRangeEnd(newEnd);
    setRangeStart(newStart);
  };

  const checkOverlap = (start: number, end: number) => {
    return cutList.some(cut => {
      const overlap = Math.max(start, cut.start) < Math.min(end, cut.end);
      return overlap;
    });
  };

  const handleAddCutToList = () => {
    if (rangeEnd <= rangeStart) {
        alert("结束时间必须大于开始时间");
        return;
    }
    if (rangeStart < 0 || rangeEnd > duration) {
        alert("剪切区间超出视频范围");
        return;
    }
    if (checkOverlap(rangeStart, rangeEnd)) {
        alert("当前时间段与已添加的剪切区间重叠，请调整时间范围。");
        return;
    }
    
    addCutMarker(rangeStart * 1000, rangeEnd * 1000);

    const newCut: CutSegment = {
      id: `cut_${Date.now()}`,
      start: rangeStart,
      end: rangeEnd,
      isAdded: true
    };
    
    setCutList(prev => {
        const newList = [newCut, ...prev];
        return newList.sort((a, b) => a.start - b.start);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-bg-secondary rounded-xl w-[800px] h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-border-secondary animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-secondary flex-shrink-0 bg-bg-primary">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-text-primary">自定义剪切 (跳播)</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          
          <div className="h-[60%] bg-black relative flex flex-col group">
             {/* 视频 */}
             <div className="flex-1 relative overflow-hidden">
               {mainVideoUrl ? (
                 <video
                   ref={videoRef}
                   src={mainVideoUrl}
                   className="w-full h-full object-contain"
                   onTimeUpdate={handleTimeUpdate}
                   onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                   onClick={togglePlay}
                   onPlay={() => setIsPlaying(true)}
                   onPause={() => setIsPlaying(false)}
                 />
               ) : (
                 <div className="flex items-center justify-center h-full text-text-tertiary">主视频未加载</div>
               )}
               
               {!isPlaying && mainVideoUrl && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                   <Play size={48} className="text-white/80 drop-shadow-lg" />
                 </div>
               )}
             </div>

             {/* 底部控制区 */}
             <div className="bg-bg-primary border-t border-border-secondary px-4 py-3 flex flex-col gap-3">
               
               {/* 进度条区域 */}
               <div className="relative h-6 flex items-center select-none">
                  {/* ... (背景槽和区间渲染保持不变) ... */}
                  <div className="absolute left-0 right-0 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                     {cutList.map(cut => (
                        <div 
                            key={cut.id}
                            className="absolute top-0 bottom-0 bg-text-tertiary/30"
                            style={{
                                left: `${(cut.start / duration) * 100}%`,
                                width: `${((cut.end - cut.start) / duration) * 100}%`
                            }}
                        />
                     ))}
                     <div 
                       className="absolute top-0 bottom-0 bg-accent-red/60"
                       style={{
                         left: `${(rangeStart / duration) * 100}%`,
                         width: `${((rangeEnd - rangeStart) / duration) * 100}%`
                       }}
                     />
                  </div>
                  
                  {/* [修改] 进度条 Input: 添加拖动时的跳跃逻辑 */}
                  <input 
                    type="range" min="0" max={duration || 100} step="0.01"
                    value={currentTime}
                    onChange={(e) => {
                      let t = parseFloat(e.target.value);
                      // 拖动时也应用跳跃逻辑，实现"吸附"效果
                      t = checkSkipTime(t);
                      setCurrentTime(t);
                      if(videoRef.current) videoRef.current.currentTime = t;
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  
                  <div 
                    className="absolute h-4 w-1 bg-white rounded-full shadow pointer-events-none z-0"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  />
               </div>

               {/* [新增] 时间显示文本 (与 InsertDialog 保持一致) */}
               <div className="flex justify-between items-center text-xs -mt-1">
                  <span className="text-text-secondary">
                    当前: <span className="text-accent-red font-mono font-bold">{currentTime.toFixed(2)}s</span>
                    <span className="mx-1">/</span>
                    <span className="text-text-tertiary">{duration.toFixed(2)}s</span>
                  </span>
               </div>

               {/* 操作按钮行 */}
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                     <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-tertiary hover:bg-bg-secondary border border-border-secondary transition-colors">
                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                     </button>
                    {/* ... (开始/结束输入框保持不变) ... */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-text-tertiary">剪切开始</span>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          className="w-16 bg-bg-tertiary border border-border-secondary rounded px-1 py-0.5 text-xs text-center"
                          value={rangeStart.toFixed(2)}
                          step={0.1}
                          min={0}
                          max={rangeEnd}
                          onChange={e => setRangeStart(Math.max(0, Math.min(Number(e.target.value), rangeEnd)))}
                        />
                        <button onClick={handleSetStart} className="px-2 py-0.5 bg-bg-tertiary hover:bg-accent-red/10 hover:text-accent-red border border-border-secondary rounded text-[10px]">
                          设为当前
                        </button>
                      </div>
                    </div>

                    <div className="text-text-tertiary">-</div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-text-tertiary">剪切结束</span>
                      <div className="flex items-center gap-1">
                         <input 
                          type="number" 
                          className="w-16 bg-bg-tertiary border border-border-secondary rounded px-1 py-0.5 text-xs text-center"
                          value={rangeEnd.toFixed(2)}
                          step={0.1}
                          min={rangeStart}
                          max={duration}
                          onChange={e => setRangeEnd(Math.max(rangeStart, Math.min(Number(e.target.value), duration)))}
                        />
                        <button onClick={handleSetEnd} className="px-2 py-0.5 bg-bg-tertiary hover:bg-accent-red/10 hover:text-accent-red border border-border-secondary rounded text-[10px]">
                          设为当前
                        </button>
                      </div>
                    </div>
                 </div>

                 <button 
                   onClick={handleAddCutToList}
                   className="flex items-center gap-2 px-4 py-2 bg-accent-red text-white rounded-lg hover:bg-accent-red/90 transition-colors shadow-sm"
                 >
                   <Scissors size={16} />
                   <span className="text-sm font-medium">添加剪切片段</span>
                 </button>
               </div>
             </div>
          </div>

          {/* ... (下部列表保持不变) ... */}
          <div className="flex-1 overflow-y-auto bg-bg-secondary p-4">
             {/* ... */}
             <h4 className="text-xs font-semibold text-text-secondary mb-3">本次操作记录 ({cutList.length})</h4>
             <div className="space-y-2">
              {cutList.length === 0 ? (
                <div className="text-center text-text-tertiary text-xs py-8 border-2 border-dashed border-border-secondary rounded-lg">
                  暂无剪切记录，请在上方选择区间并添加
                </div>
              ) : (
                cutList.map((cut, index) => (
                  <div key={cut.id} className="flex items-center justify-between p-3 bg-bg-primary border border-border-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent-red/10 text-accent-red flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-text-primary">
                          剪切区间: {cut.start.toFixed(2)}s - {cut.end.toFixed(2)}s
                        </span>
                        <span className="text-[10px] text-text-tertiary">
                          时长: {(cut.end - cut.start).toFixed(2)}s
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-500/10 px-2 py-1 rounded">
                        <CheckCircle size={10} /> 已生效
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}