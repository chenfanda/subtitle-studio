import { Suspense, lazy, useState, useCallback, useEffect } from 'react';
import { HeaderBar } from '../layout/HeaderBar';
import { LeftSidebar } from '../layout/LeftSidebar';
import { VideoArea } from '../layout/VideoArea';
import { VideoControls } from '../video/VideoControls';
import { TimelineArea } from '../layout/TimelineArea';
import { BackgroundMusicPlayer } from '../audio/BackgroundMusicPlayer';
import { SoundEffectPlayer } from '../audio/SoundEffectPlayer';
import { AudioPreviewPlayer } from '../audio/AudioPreviewPlayer';
import { useProjectStore } from '@/stores/useProjectStore';
import GlobalModals from '../common/GlobalModals';
import { 
  useLeftPanelCollapsed, 
  useTimelineCollapsed,
  useUIStore, // 👈 确保引入这个
  useSelectedAttachment 
} from '@/stores/useUIStore';

const BrollDialog = lazy(() => import('../broll/BrollDialog'));
const VoiceoverDialog = lazy(() => import('../audio/voiceover/VoiceoverDialog'));
const InsertVideoDialog = lazy(() => import('../clips/InsertVideoDialog'));
const VoiceoverSettingsPanel = lazy(() => import('../audio/VoiceoverSettingsPanel'));
const SoundEffectSettingsPanel = lazy(() => import('../audio/SoundEffectSettingsPanel'));
const BackgroundMusicSettingsPanel = lazy(() => import('../audio/BackgroundMusicSettingsPanel'));
const RichTextEditor = lazy(() => import('../common/RichTextEditor'));

export function EditingStage() {
  const collapsed = useLeftPanelCollapsed();
  const timelineCollapsed = useTimelineCollapsed();
  const projectDuration = useProjectStore((state) => state.duration);
  
  // ✨ 1. 从 Store 获取设置宽度的动作
  const { 
    showRichTextEditor, 
    richTextEditorTarget,
    setShowRichTextEditor,
    setRichTextEditorTarget,
    activeDialog,
    dialogTargetSubtitleId,
    closeDialog,
    setLeftPanelWidth // 👈 新增
  } = useUIStore();

  const selectedAttachment = useSelectedAttachment();

  // ✨ 2. 本地状态：是否正在拖拽
  const [isResizing, setIsResizing] = useState(false);

  // ✨ 3. 开始拖拽
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // ✨ 4. 监听鼠标移动 (绑定到 document 以防止鼠标滑出)
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // e.clientX 是鼠标距离屏幕左侧的距离，直接作为新的宽度
      setLeftPanelWidth(e.clientX);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // 优化体验：拖拽时强制鼠标样式
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, setLeftPanelWidth]);

  const handleCloseRichTextEditor = () => {
    setShowRichTextEditor(false);
    setRichTextEditorTarget(null);
  };

  const renderRightPanel = () => {
    if (selectedAttachment) {
      switch (selectedAttachment.type) {
        case 'audio':
          return <VoiceoverSettingsPanel key={selectedAttachment.subtitleId} subtitleId={selectedAttachment.subtitleId} />;
        case 'soundEffect':
          return <SoundEffectSettingsPanel key={selectedAttachment.subtitleId} subtitleId={selectedAttachment.subtitleId} />;
        case 'backgroundMusic':
          return <BackgroundMusicSettingsPanel />;
        default:
          return null;
      }
    }

    if (showRichTextEditor && richTextEditorTarget) {
       return (
         <RichTextEditor
           targetType={richTextEditorTarget.type}
           targetId={richTextEditorTarget.id}
           onClose={handleCloseRichTextEditor}
         />
       );
    }
    return null;
  };
  
  const RightPanelWrapper = () => {
    const panelContent = renderRightPanel();
    if (!panelContent) return null;
    return (
      <div className="border-l border-border-secondary">
        <Suspense fallback={null}>{panelContent}</Suspense>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-bg-primary text-text-primary overflow-hidden flex flex-col">
      <HeaderBar />

      <div className="flex-1 flex overflow-hidden relative"> 
        
        {!collapsed && (
          <>
            {/* 左侧面板 */}
            <div className="border-r border-border-secondary flex-shrink-0">
              <LeftSidebar />
            </div>
            
            {/* ✨ 5. 拖拽手柄 (位于左侧栏和主内容之间) */}
            <div
              className={`w-1 hover:w-1.5 -ml-0.5 z-50 cursor-col-resize flex flex-col justify-center transition-all hover:bg-accent-purple/50 active:bg-accent-purple ${
                isResizing ? 'bg-accent-purple w-1.5' : 'bg-transparent'
              }`}
              onMouseDown={startResizing}
              title="拖拽调整宽度"
            />
          </>
        )}

        {/* 右侧主内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          
          <div className="flex-1 flex overflow-hidden">
            
            <div className="flex-1 overflow-hidden">
              <VideoArea />
            </div>

            <RightPanelWrapper />

          </div>

          <div className="flex-shrink-0 border-t-2 border-gray-600">
            <VideoControls />
          </div>

          {!timelineCollapsed && (projectDuration > 0) && (
            <div className="h-45 border-t border-border-primary flex-shrink-0">
              <TimelineArea />
            </div>
          )}
        </div>
      </div>

      <BackgroundMusicPlayer /> 
      <SoundEffectPlayer />
      <AudioPreviewPlayer /> 

      <Suspense fallback={null}>
        {activeDialog === 'broll' && (
          <BrollDialog open={true} onClose={closeDialog} targetSubtitleId={dialogTargetSubtitleId || ''} />
        )}
        {activeDialog === 'voiceover' && (
          <VoiceoverDialog open={true} onClose={closeDialog} targetSubtitleId={dialogTargetSubtitleId || ''} />
        )}
        {activeDialog === 'insertVideo' && (
          <InsertVideoDialog />
        )}
      </Suspense>
      <GlobalModals />
    </div>
  );
}