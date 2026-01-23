import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft, Play, Pause, Volume2, Clock } from 'lucide-react';
import { formatDuration } from '@/utils/audioUtils';
import type { BrollVideo } from '@/types/broll';

interface InsertVideoEditViewProps {
  video: BrollVideo;
  onBack: () => void;
  onApply: (range: { startTime: number; endTime: number }, volume: number) => void;
}

export function InsertVideoEditView({ video, onBack, onApply }: InsertVideoEditViewProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // 编辑状态
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(video.duration);
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => setIsPlaying(false));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const curr = videoRef.current.currentTime;
      setCurrentTime(curr);

      // 循环播放选中片段逻辑 (可选，或者播放到结束停止)
      if (curr >= endTime) {
        if (isPlaying) {
          // 循环播放
          videoRef.current.currentTime = startTime;
        }
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      // 如果当前不在区间内，播放时跳回开始点
      if (!isPlaying && (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime)) {
        videoRef.current.currentTime = startTime;
      }
      setIsPlaying(!isPlaying);
    }
  };

  // --- 新增：设为当前时间的逻辑 (仿照 BatchCutDialog) ---
  const handleSetStart = () => {
    const t = currentTime;
    let newEnd = endTime;

    // 如果设置的开始时间比结束时间晚，或者太接近，自动把结束时间往后推
    if (newEnd <= t) {
      newEnd = Math.min(t + 5.0, video.duration); // 默认向后推5秒
    }
    // 边界保护
    if (newEnd <= t) {
      // 如果已经推到视频末尾了还不够，那就不允许设置
      return;
    }

    setStartTime(t);
    setEndTime(newEnd);
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  const handleSetEnd = () => {
    const t = currentTime;
    let newStart = startTime;

    // 如果设置的结束时间比开始时间早，自动把开始时间往前推
    if (newStart >= t) {
      newStart = Math.max(0, t - 5.0);
    }

    setEndTime(t);
    setStartTime(newStart);
    // 这里通常不跳转进度，保持在结束帧方便确认
  };

  return (
    <div className="h-full flex flex-col bg-bg-secondary">
      {/* 顶部标题栏 */}
      <div className="px-4 py-3 border-b border-border-secondary flex-shrink-0 flex justify-between items-center bg-bg-primary">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">{t('返回列表')}</span>
        </button>
        <h3 className="text-sm font-medium text-text-primary">{t('编辑素材片段')}</h3>
      </div>

      {/* 中间内容区域 */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* 视频容器 */}
        <div className="flex-1 bg-black relative w-full min-h-0 group flex flex-col">
          <video
            ref={videoRef}
            src={video.url}
            className="w-full h-full object-contain flex-1"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onClick={togglePlay}
          />
          {/* 播放/暂停 遮罩层 */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer pointer-events-none"
          >
            <div className="pointer-events-auto" onClick={togglePlay}>
              {!isPlaying ? <Play size={48} className="text-white drop-shadow-lg" /> : <Pause size={48} className="text-white drop-shadow-lg" />}
            </div>
          </div>
        </div>

        {/* 控制面板 */}
        <div className="p-4 bg-bg-secondary flex-shrink-0 border-t border-border-secondary space-y-4">

          {/* 1. 进度条可视化 */}
          <div className="relative h-6 flex items-center select-none">
            {/* 背景槽 */}
            <div className="absolute left-0 right-0 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              {/* 选中区域 (紫色) */}
              <div
                className="absolute top-0 bottom-0 bg-accent-purple/60"
                style={{
                  left: `${(startTime / video.duration) * 100}%`,
                  width: `${((endTime - startTime) / video.duration) * 100}%`
                }}
              />
            </div>

            {/* 真实的滑动输入 (用于拖动预览) */}
            <input
              type="range" min="0" max={video.duration} step="0.01"
              value={currentTime}
              onChange={(e) => {
                const t = parseFloat(e.target.value);
                setCurrentTime(t);
                if (videoRef.current) videoRef.current.currentTime = t;
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />

            {/* 播放头 */}
            <div
              className="absolute top-0 bottom-0 w-1 h-4 my-auto bg-white rounded shadow z-0 pointer-events-none"
              style={{ left: `${(currentTime / video.duration) * 100}%` }}
            />
          </div>

          {/* 2. 时间控制 (仿照 BatchCutDialog 样式) */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-6">

              {/* 开始时间 */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-text-tertiary">{t('开始时间')}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-20 bg-bg-tertiary border border-border-secondary rounded px-2 py-1 text-xs text-center focus:border-accent-purple focus:outline-none"
                    value={startTime.toFixed(2)}
                    step={0.1}
                    min={0}
                    max={endTime}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(parseFloat(e.target.value), endTime));
                      setStartTime(val);
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                  />
                  <button
                    onClick={handleSetStart}
                    className="flex items-center gap-1 px-2 py-1 bg-bg-tertiary hover:bg-accent-purple/10 hover:text-accent-purple border border-border-secondary rounded text-[10px] transition-colors"
                    title={t("将当前播放时间设为开始点")}
                  >
                    <Clock size={10} /> {t('设为当前')}
                  </button>
                </div>
              </div>

              <div className="text-text-tertiary pt-4">-</div>

              {/* 结束时间 */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-text-tertiary">{t('结束时间')}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-20 bg-bg-tertiary border border-border-secondary rounded px-2 py-1 text-xs text-center focus:border-accent-purple focus:outline-none"
                    value={endTime.toFixed(2)}
                    step={0.1}
                    min={startTime}
                    max={video.duration}
                    onChange={(e) => {
                      const val = Math.max(startTime, Math.min(parseFloat(e.target.value), video.duration));
                      setEndTime(val);
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                  />
                  <button
                    onClick={handleSetEnd}
                    className="flex items-center gap-1 px-2 py-1 bg-bg-tertiary hover:bg-accent-purple/10 hover:text-accent-purple border border-border-secondary rounded text-[10px] transition-colors"
                    title={t("将当前播放时间设为结束点")}
                  >
                    <Clock size={10} /> {t('设为当前')}
                  </button>
                </div>
              </div>
            </div>

            {/* 时长显示 */}
            <div className="flex flex-col items-end justify-center">
              <span className="text-[10px] text-text-tertiary">{t('片段时长')}</span>
              <span className="text-sm font-mono font-bold text-accent-purple">{formatDuration(endTime - startTime)}</span>
            </div>
          </div>

          {/* 3. 音量控制 */}
          <div className="flex items-center gap-3 pt-2 border-t border-border-secondary/50">
            <Volume2 size={16} className="text-text-secondary" />
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-32 h-1 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-purple focus:outline-none"
            />
            <span className="text-xs text-text-secondary w-8">{volume}%</span>
          </div>

        </div>
      </div>

      {/* 底部按钮 */}
      <div className="p-4 border-t border-border-secondary flex-shrink-0 bg-bg-secondary">
        <button
          onClick={() => onApply({ startTime, endTime }, volume)}
          className="w-full py-2.5 rounded-lg bg-accent-purple hover:bg-accent-purple/90 text-white font-medium transition-colors text-sm focus:outline-none focus:ring-0 shadow-sm"
        >
          {t('确认保存修改')}
        </button>
      </div>
    </div>
  );
}