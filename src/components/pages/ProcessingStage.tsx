import React, { useEffect, useState, useRef } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { uploadAndInitializeProject } from '@/utils/projectCreationApi';
import { 
  AlertCircle, 
  RotateCcw, 
  ArrowLeft,
  AudioWaveform,
  Brain,
  Type,
  Cpu,
  Timer
} from 'lucide-react';

const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject('无法获取视频时长');
    video.src = URL.createObjectURL(file);
  });
};

const preloadAudioTracks = (urls: string[]): Promise<void[]> => {
  const promises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const audio = new Audio();
      
      
      audio.addEventListener('canplaythrough', () => {
        resolve();
      }, { once: true });

     
      audio.addEventListener('error', () => {
        reject(new Error(`无法预加载音频: ${url}`));
      }, { once: true });

      audio.src = url;
      audio.preload = 'auto';
    });
  });

  return Promise.all(promises);
};

export const ProcessingStage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // 计时器状态
  
  const processingRef = useRef(false);

  const pendingUploadFile = useProjectStore((state) => state.pendingUploadFile);
  const setProcessedResources = useProjectStore((state) => state.setProcessedResources);
  const setVideoUrl = useProjectStore((state) => state.setVideoUrl);
  const setAppStage = useProjectStore((state) => state.setAppStage);

  useEffect(() => {
    const startTime = Date.now();
    let animationFrameId: number;

    const updateTimer = () => {
      setElapsedTime(Date.now() - startTime);
      animationFrameId = requestAnimationFrame(updateTimer);
    };

    // 立即启动计时
    updateTimer();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []); // 空依赖数组，确保组件挂载即开始计时，不依赖其他状态

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10); // 取前两位
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    const msStr = milliseconds.toString().padStart(2, '0');
    return { m, s, ms: msStr };
  };


  useEffect(() => {
    if (pendingUploadFile && !processingRef.current) {
      processFile(pendingUploadFile);
    }
  }, [pendingUploadFile]);

  const processFile = async (file: File) => {
    processingRef.current = true;
    setError(null);

    try {
      const localVideoUrl = URL.createObjectURL(file);

    
      const [duration, data] = await Promise.all([
        getVideoDuration(file),
        uploadAndInitializeProject({
          file,
          onProgress: () => {}, 
          enableVocalSeparation: true 
        })
      ]);
      
      const { sourceResources } = data;
      const audioUrlsToPreload: string[] = [];
      if (sourceResources?.audioVocals) {
        audioUrlsToPreload.push(sourceResources.audioVocals);
      }
      if (sourceResources?.audioBacking) {
        audioUrlsToPreload.push(sourceResources.audioBacking);
      }
      if (audioUrlsToPreload.length > 0) {
        console.log('开始预加载音频...');
        await preloadAudioTracks(audioUrlsToPreload);
        console.log('音频预加载完成!');
      }

      const formattedSubtitles = data.subtitles.map((sub: any) => ({
        ...sub,
        startTime: sub.startTime < 10000 ? sub.startTime * 1000 : sub.startTime,
        endTime: sub.endTime < 10000 ? sub.endTime * 1000 : sub.endTime,
      }));
      useSubtitleStore.getState().restoreSubtitles(formattedSubtitles);

      setProcessedResources(data.sourceResources);
      setVideoUrl(localVideoUrl);
      useProjectStore.getState().setDuration(duration);
      
      setAppStage('editing');

    } catch (err) {
      console.error('处理流程失败:', err);
      setError(err instanceof Error ? err.message : '处理视频时发生未知错误');
      processingRef.current = false;
    }
  };

  const handleRetry = () => {
    if (pendingUploadFile) {
      processingRef.current = false; // 重置锁
      processFile(pendingUploadFile);
    } else {
      setAppStage('upload');
    }
  };

  const timeDisplay = formatTime(elapsedTime);

  return (
    <div className="relative min-h-screen bg-[#050505] text-white flex items-center justify-center p-8 overflow-hidden font-sans selection:bg-purple-500/30">
      
      {/* 动态背景 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[60%] h-[300px] bg-purple-900/20 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_800px_at_center,black_30%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* 卡片容器 */}
        <div className="relative bg-[#0a0a0c]/90 border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
            
            {/* 顶部扫描线 */}
            {!error && <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-scan-line z-20"></div>}

            <div className="flex-1 flex flex-col items-center p-8 relative">

                {/* --- 顶部区域：计时器 (TOP) --- */}
                {!error && (
                  <div className="w-full flex flex-col items-center justify-center pt-4 mb-8 z-20">
                     <div className="flex items-center gap-2 mb-2 opacity-50">
                        <Timer size={14} className="text-purple-400" />
                        <span className="text-[10px] font-mono tracking-[0.2em] uppercase">Processing Time</span>
                     </div>
                     <div className="text-6xl font-mono font-bold tracking-tighter text-white tabular-nums drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] flex items-baseline">
                        <span>{timeDisplay.m}</span>
                        <span className="animate-pulse text-white/50 mx-1">:</span>
                        <span>{timeDisplay.s}</span>
                        <span className="text-2xl text-purple-400 font-medium ml-1 w-[1.2em] text-left opacity-80">.{timeDisplay.ms}</span>
                     </div>
                  </div>
                )}

                {error ? (
                    // -----------------------------
                    // 错误视图
                    // -----------------------------
                    <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300 w-full flex-1 justify-center">
                        <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/30">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">任务中断</h3>
                        <p className="text-white/50 text-sm max-w-xs mb-8 font-mono bg-white/5 px-4 py-2 rounded">{error}</p>
                        
                        <div className="flex gap-4 w-full px-8">
                             <button onClick={() => setAppStage('upload')} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-all text-sm font-medium border border-white/5 flex items-center justify-center gap-2">
                                <ArrowLeft size={16} /> 返回
                             </button>
                             <button onClick={handleRetry} className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 transition-all text-sm font-medium flex items-center justify-center gap-2">
                                <RotateCcw size={16} /> 重试
                             </button>
                        </div>
                    </div>
                ) : (
                    // -----------------------------
                    // 正常视图 (莫比乌斯环 + 闪动图标)
                    // -----------------------------
                    <div className="flex-1 w-full flex flex-col justify-between items-center">
                        
                        {/* 中部：流动的莫比乌斯环 (Visual Anchor) */}
                        <div className="relative w-full flex items-center justify-center flex-1">
                            <div className="relative w-72 h-36">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 220 100">
                                    <defs>
                                        <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
                                            <stop offset="50%" stopColor="#d8b4fe" />
                                            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                                        </linearGradient>
                                        <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
                                            <feGaussianBlur stdDeviation="3" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                    </defs>

                                    {/* 背景轨迹 */}
                                    <path 
                                        d="M110,50 C110,85 165,85 165,50 C165,15 110,15 110,50 C110,85 55,85 55,50 C55,15 110,15 110,50 Z"
                                        fill="none" 
                                        stroke="#1e1e24" 
                                        strokeWidth="6"
                                    />

                                    {/* 动态流动的前景 */}
                                    <path 
                                        d="M110,50 C110,85 165,85 165,50 C165,15 110,15 110,50 C110,85 55,85 55,50 C55,15 110,15 110,50 Z"
                                        fill="none" 
                                        stroke="url(#flow-gradient)" 
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        filter="url(#glow-strong)"
                                        className="animate-flow-dash" 
                                    />
                                </svg>
                                
                                {/* 环中心的装饰字 */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Cpu size={24} className="text-purple-500/20 animate-pulse" />
                                </div>
                            </div>
                        </div>

                        {/* 底部：AI 阵列 (闪动效果) */}
                        <div className="w-full grid grid-cols-3 gap-3 mt-4">
                            {/* 模块1 */}
                            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <AudioWaveform className="w-5 h-5 text-white/20 animate-flash-1" />
                                <span className="text-[10px] uppercase text-white/30 font-medium tracking-wide">Audio</span>
                            </div>

                             {/* 模块2 */}
                            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <Brain className="w-5 h-5 text-white/20 animate-flash-2" />
                                <span className="text-[10px] uppercase text-white/30 font-medium tracking-wide">Neural</span>
                            </div>

                             {/* 模块3 */}
                            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <Type className="w-5 h-5 text-white/20 animate-flash-3" />
                                <span className="text-[10px] uppercase text-white/30 font-medium tracking-wide">Output</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      <style>{`
        /* 莫比乌斯环流动动画 */
        .animate-flow-dash {
            stroke-dasharray: 80 180; /* 线段长 间隙长 */
            stroke-dashoffset: 260;
            animation: flow 1.5s linear infinite;
        }
        @keyframes flow {
            to { stroke-dashoffset: 0; }
        }

        /* 扫描线动画 */
        @keyframes scan-line {
            0% { transform: translateX(-100%); opacity: 0; }
            15% { opacity: 1; }
            85% { opacity: 1; }
            100% { transform: translateX(100%); opacity: 0; }
        }
        .animate-scan-line {
            animation: scan-line 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        /* 呼吸闪烁动画序列 */
        @keyframes flash {
            0%, 100% { color: rgba(255,255,255,0.2); filter: drop-shadow(0 0 0 transparent); }
            50% { color: #c084fc; filter: drop-shadow(0 0 8px #a855f7); }
        }
        .animate-flash-1 { animation: flash 1.8s infinite ease-in-out; animation-delay: 0s; }
        .animate-flash-2 { animation: flash 1.8s infinite ease-in-out; animation-delay: 0.6s; }
        .animate-flash-3 { animation: flash 1.8s infinite ease-in-out; animation-delay: 1.2s; }
      `}</style>
    </div>
  );
};