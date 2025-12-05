import { useState, useMemo, useEffect } from 'react'; 
import { useUIStore } from '@/stores/useUIStore'; 
import { useSubtitleStore } from '@/stores/useSubtitleStore'; 
import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore'; 
import { findGlobalTimeFromMainTime } from '@/utils/timelineUtils'; 
import { InsertVideoLocalView } from './InsertVideoLocalView'; 
import { InsertVideoEditView } from './InsertVideoEditView'; 
import { UploadCloud, Clapperboard, Link } from 'lucide-react'; 
import type { BrollVideo } from '@/types/broll'; 

type InsertVideoTab = 'local' | 'library' | 'url'; 
type DialogView = 'local' | 'library' | 'url' | 'edit'; 

export default function InsertVideoDialog() { 
  const { activeDialog, dialogTargetSubtitleId, closeDialog } = useUIStore(); 
  const { subtitles } = useSubtitleStore(); 
  const addInsertSegment = useVideoSequenceStore((state) => state.addInsertSegment); 
  const segments = useVideoSequenceStore((state) => state.segments); 

  const [activeTab, setActiveTab] = useState<InsertVideoTab>('local'); 
  const [dialogView, setDialogView] = useState<DialogView>('local'); 
  const [selectedVideo, setSelectedVideo] = useState<BrollVideo | null>(null); 

  const open = activeDialog === 'insertVideo'; 
  const targetSubtitleId = dialogTargetSubtitleId; 

  const targetSubtitle = useMemo(() => { 
    if (!targetSubtitleId) return null; 
    return subtitles.find(s => s.id === targetSubtitleId); 
  }, [targetSubtitleId, subtitles]); 

  useEffect(() => { 
    if (!open) { 
      setDialogView('local'); 
      setActiveTab('local'); 
      setSelectedVideo(null); 
    } 
  }, [open]); 

  const handleClose = () => { 
    closeDialog(); 
  }; 

  if (!open || !targetSubtitle) { 
    return null; 
  } 

  const handleVideoSelect = (video: BrollVideo) => { 
    setSelectedVideo(video); 
    setDialogView('edit'); 
  }; 

  const handleBackToLocal = () => { 
    setDialogView('local'); 
    setActiveTab('local'); 
  }; 

  const handleApply = (range: { startTime: number; endTime: number }, volume: number) => { 
    if (!selectedVideo || !targetSubtitle) return; 

    
    const startSec = range?.startTime ?? 0;
    const endSec = range?.endTime ?? selectedVideo.duration;

    const mainTimeSec = targetSubtitle.endTime / 1000; 
    const globalInsertTimeMs = findGlobalTimeFromMainTime(mainTimeSec, segments) * 1000; 
    
    // 计算毫秒
    const durationInMs = Math.floor((endSec - startSec) * 1000); 
    const sourceStartTimeMs = Math.floor(startSec * 1000); 
    
    
    addInsertSegment(
        selectedVideo.url, 
        durationInMs, 
        globalInsertTimeMs, 
        sourceStartTimeMs,
        volume
    ); 
    
    handleClose(); 
  }; 

  const renderContent = () => { 
    if (dialogView === 'edit' && selectedVideo) { 
      return ( 
        <InsertVideoEditView 
          video={selectedVideo} 
          onBack={handleBackToLocal} 
          onApply={handleApply} 
        />
      ); 
    } 
    
    switch (activeTab) { 
      case 'local': 
        return ( 
          <InsertVideoLocalView 
            onVideoSelect={handleVideoSelect} 
            selectedVideo={selectedVideo} 
          />
        ); 
      case 'library': 
        return ( 
          <div className="p-10 text-center text-text-tertiary">
            <Clapperboard size={48} className="mx-auto mb-3" />
            素材库功能暂未开放
          </div>
        ); 
      case 'url': 
        return ( 
          <div className="p-10 text-center text-text-tertiary">
            <Link size={48} className="mx-auto mb-3" />
            URL 下载功能暂未开放
          </div>
        ); 
      default: 
        return null; 
    } 
  }; 

  return ( 
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-bg-secondary rounded-lg w-[600px] h-[70vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border-secondary flex-shrink-0">
          <h3 className="text-lg font-semibold text-text-primary">插入视频</h3>
          <button
            onClick={handleClose} 
            className="w-8 h-8 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center" 
          >
            ✕
          </button>
        </div>

        {dialogView !== 'edit' && ( 
          <div className="p-3 border-b border-border-secondary flex-shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('local')} 
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
                  ${activeTab === 'local' 
                    ? 'bg-bg-tertiary text-text-primary' 
                    : 'text-text-secondary hover:bg-bg-tertiary/50'} 
                `} 
              >
                <UploadCloud size={16} />
                本地上传
              </button>
              <button
                onClick={() => setActiveTab('library')} 
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
                  ${activeTab === 'library' 
                    ? 'bg-bg-tertiary text-text-primary' 
                    : 'text-text-secondary hover:bg-bg-tertiary/50'} 
                `} 
              >
                <Clapperboard size={16} />
                素材库
              </button>
              <button
                onClick={() => setActiveTab('url')} 
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
                  ${activeTab === 'url' 
                    ? 'bg-bg-tertiary text-text-primary' 
                    : 'text-text-secondary hover:bg-bg-tertiary/50'} 
                `} 
              >
                <Link size={16} />
                URL 下载
              </button>
            </div>
          </div>
        )} 

        <div className="flex-1 overflow-y-auto">
          {renderContent()} 
        </div>
      </div>
    </div>
  ); 
}