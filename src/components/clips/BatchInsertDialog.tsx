import { useState, useRef, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';
import { InsertVideoEditView } from './InsertVideoEditView';
import { getBrollDuration, generateBrollThumbnail } from '@/utils/brollUtils';
import { Clock, Scissors, CheckCircle, Play, X, ArrowLeft, Plus, Pause } from 'lucide-react';
import type { BrollVideo } from '@/types/broll';

interface BatchVideoItem extends BrollVideo {
  insertTime: number;
  trimStart: number;
  trimEnd: number;
  volume: number;
  isAdded: boolean;
}

export function BatchInsertDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { segments, addInsertSegment } = useVideoSequenceStore();

  const [view, setView] = useState<'list' | 'edit'>('list');
  const [items, setItems] = useState<BatchVideoItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const [mainCurrentTime, setMainCurrentTime] = useState(0);
  const [mainDuration, setMainDuration] = useState(0);
  const [isMainPlaying, setIsMainPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mainVideoUrl = useMemo(() => {
    return segments.find(s => s.type === 'main')?.sourceUrl || '';
  }, [segments]);

  // 获取所有剪切区间
  const cutIntervals = useMemo(() => {
    return segments
      .filter(s => s.type === 'cut')
      .map(s => ({
        start: s.sourceStartTime / 1000,
        end: (s.sourceStartTime + s.duration) / 1000
      }));
  }, [segments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('video/mp4')) continue;
      try {
        const url = URL.createObjectURL(file);
        const duration = await getBrollDuration(url);
        const thumbnail = await generateBrollThumbnail(url, 1);
        setItems(prev => [...prev, {
          id: `batch_${Date.now()}_${Math.random()}`,
          name: file.name,
          url,
          thumbnail,
          duration,
          tags: [],
          insertTime: 0,
          trimStart: 0,
          trimEnd: duration,
          volume: 50,
          isAdded: false,
        }]);
      } catch (err) {
        console.error("Load failed", err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const syncTimeFromMain = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, insertTime: parseFloat(mainCurrentTime.toFixed(3)) } : item
    ));
  };

  const handleConfirmAdd = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    addInsertSegment(item.url, (item.trimEnd - item.trimStart) * 1000, item.insertTime * 1000, item.trimStart * 1000, item.volume);
    setItems(prev => prev.map(i => i.id === id ? { ...i, isAdded: true } : i));
  };

  const handleEditStart = (id: string) => {
    setEditingId(id);
    setView('edit');
  };

  const handleEditApply = (range: { startTime: number; endTime: number }, volume: number) => {
    setItems(prev => prev.map(item =>
      item.id === editingId ? { ...item, trimStart: range.startTime, trimEnd: range.endTime, volume } : item
    ));
    setView('list');
    setEditingId(null);
  };

  // [修改] 播放/暂停逻辑
  const toggleMainPlay = () => {
    if (mainVideoRef.current) {
      if (isMainPlaying) {
        mainVideoRef.current.pause();
        setIsMainPlaying(false);
      } else {
        // 如果当前正好停在剪切开始点（因为之前自动暂停了），
        // 用户再次点击播放时，自动跳过剪切区间，继续播放
        const currentTime = mainVideoRef.current.currentTime;
        const stuckAtCut = cutIntervals.find(c => Math.abs(currentTime - c.start) < 0.1);

        if (stuckAtCut) {
          mainVideoRef.current.currentTime = stuckAtCut.end;
        }

        mainVideoRef.current.play();
        setIsMainPlaying(true);
      }
    }
  };

  // [修改] 进度条拖动：吸附到剪切开始点
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    let time = parseFloat(e.target.value);

    // 如果拖动到了剪切区间内部，强制吸附到区间的开始点
    // 方便用户定位到"剪切发生的那一刻"进行插入
    const insideCut = cutIntervals.find(c => time > c.start && time < c.end);
    if (insideCut) {
      time = insideCut.start;
    }

    setMainCurrentTime(time);
    if (mainVideoRef.current) {
      mainVideoRef.current.currentTime = time;
    }
  };

  // [修改] 播放过程监控：遇到剪切点自动暂停
  const handleTimeUpdate = () => {
    if (mainVideoRef.current) {
      const rawTime = mainVideoRef.current.currentTime;

      // 检查是否进入了剪切区间
      // 使用 0.05 的缓冲，确保不是刚跳出区间的情况
      const hitCut = cutIntervals.find(c => rawTime > c.start + 0.05 && rawTime < c.end);

      if (hitCut && isMainPlaying) {
        // 1. 暂停播放
        mainVideoRef.current.pause();
        setIsMainPlaying(false);

        // 2. 吸附到剪切点开始位置
        mainVideoRef.current.currentTime = hitCut.start;
        setMainCurrentTime(hitCut.start);
      } else {
        // 正常更新进度
        setMainCurrentTime(rawTime);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (mainVideoRef.current) {
      setMainDuration(mainVideoRef.current.duration);
    }
  };

  const renderContent = () => {
    if (view === 'edit' && editingId) {
      const editItem = items.find(i => i.id === editingId);
      if (!editItem) return null;
      return <InsertVideoEditView video={editItem} onBack={() => setView('list')} onApply={handleEditApply} />;
    }

    return (
      <div className="flex flex-col h-full overflow-hidden bg-bg-secondary">

        {/* 上半部分：主视频预览 */}
        <div className="h-[50%] flex-shrink-0 bg-black relative flex flex-col group border-b border-border-secondary">
          <div className="flex-1 relative overflow-hidden">
            <video
              ref={mainVideoRef}
              src={mainVideoUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onClick={toggleMainPlay}
              onPlay={() => setIsMainPlaying(true)}
              onPause={() => setIsMainPlaying(false)}
            />
            {!isMainPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                <Play size={48} className="text-white/80 drop-shadow-lg" />
              </div>
            )}

            {/* 播放控制按钮 (浮动在视频上或底部) */}
            <div className="absolute bottom-4 left-4 z-10">
              <button
                onClick={toggleMainPlay}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-accent-purple text-white backdrop-blur-sm transition-colors"
              >
                {isMainPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
            </div>
          </div>

          {/* 底部控制条 */}
          <div className="bg-bg-primary border-t border-border-secondary px-4 py-2 flex flex-col gap-1 flex-shrink-0">
            <input
              type="range"
              min={0}
              max={mainDuration || 100}
              step={0.01}
              value={mainCurrentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-purple"
            />
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-text-secondary">
                {t('当前')}: <span className="text-accent-purple font-mono font-bold">{mainCurrentTime.toFixed(2)}s</span>
                <span className="mx-1">/</span>
                <span className="text-text-tertiary">{mainDuration.toFixed(2)}s</span>
              </span>
              <span className="text-[10px] text-text-tertiary">
                {cutIntervals.length > 0 ? t('遇到剪切点将自动暂停，方便插入') : t('拖动进度条选择插入点')}
              </span>
            </div>
          </div>
        </div>

        {/* 下半部分：素材列表 (保持不变) */}
        <div className="flex-1 flex flex-col min-h-0 bg-bg-secondary">
          <div className="flex items-center justify-between p-3 border-b border-border-secondary bg-bg-tertiary/50">
            <div className="text-xs font-medium text-text-secondary">{t('待插入素材')} ({items.length})</div>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-purple text-white rounded text-xs hover:bg-accent-purple/90 transition-colors shadow-sm">
              <Plus size={14} /><span>{t('添加视频')}</span>
            </button>
            <input ref={fileInputRef} type="file" multiple accept="video/mp4" className="hidden" onChange={handleFileUpload} />
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {items.map(item => (
              <div key={item.id} className={`flex gap-3 p-3 rounded-lg border transition-all ${item.isAdded ? 'border-green-500/30 bg-green-500/5' : 'border-border-secondary bg-bg-primary hover:border-border-primary'}`}>

                <div className="w-28 h-16 bg-black rounded overflow-hidden flex-shrink-0 relative border border-border-secondary group">
                  <img src={item.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                  <div className="absolute bottom-0 right-0 bg-black/70 text-[10px] text-white px-1.5 py-0.5 rounded-tl">{((item.trimEnd - item.trimStart)).toFixed(1)}s</div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold truncate text-text-primary max-w-[200px]" title={item.name}>{item.name}</span>
                    <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} className="text-text-tertiary hover:text-accent-red transition-colors"><X size={14} /></button>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <div className="flex-1 flex items-center gap-2 bg-bg-tertiary/50 p-1 rounded border border-border-secondary">
                      <span className="text-[10px] text-text-tertiary pl-1">{t('插入点')}:</span>
                      <input type="number" step="0.1" value={item.insertTime} onChange={(e) => { const val = parseFloat(e.target.value); setItems(prev => prev.map(i => i.id === item.id ? { ...i, insertTime: isNaN(val) ? 0 : val } : i)); }} className="w-16 bg-bg-secondary border border-border-primary rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:border-accent-purple" />
                      <span className="text-[10px] text-text-tertiary">{t('秒')}</span>
                      <button onClick={() => syncTimeFromMain(item.id)} title={t('填入当前预览时间')} className="ml-auto p-1 hover:bg-bg-tertiary rounded text-accent-purple hover:text-accent-purple/80 transition-colors flex items-center gap-1"><Clock size={12} /></button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditStart(item.id)} className="px-2.5 py-1.5 bg-bg-tertiary border border-border-primary rounded text-xs hover:text-accent-purple flex items-center gap-1"><Scissors size={12} /><span>{t('剪辑')}</span></button>
                      <button onClick={() => handleConfirmAdd(item.id)} disabled={item.isAdded} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-all min-w-[64px] justify-center ${item.isAdded ? 'bg-green-600/10 text-green-600 border border-green-600/20 cursor-default' : 'bg-accent-purple text-white hover:bg-accent-purple/90 shadow-sm'}`}>{item.isAdded ? <CheckCircle size={12} /> : null}{item.isAdded ? t('已添加') : t('添加')}</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-bg-secondary rounded-xl w-[900px] h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-border-secondary animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-secondary flex-shrink-0 bg-bg-primary">
          <div className="flex items-center gap-2">
            {view === 'edit' && <button onClick={() => setView('list')} className="text-text-secondary hover:text-text-primary mr-1"><ArrowLeft size={18} /></button>}
            <h3 className="text-base font-semibold text-text-primary">{view === 'edit' ? t('编辑素材片段') : t('批量插入视频')}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-hidden relative">{renderContent()}</div>
      </div>
    </div>
  );
}