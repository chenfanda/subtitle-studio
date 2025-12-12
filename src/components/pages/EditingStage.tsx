import { Suspense, lazy } from 'react';
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
  useUIStore,
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
  const { 
    showRichTextEditor, 
    richTextEditorTarget,
    setShowRichTextEditor,
    setRichTextEditorTarget,
    activeDialog,
    dialogTargetSubtitleId,
    closeDialog
  } = useUIStore();

  const selectedAttachment = useSelectedAttachment();

  const handleCloseRichTextEditor = () => {
    setShowRichTextEditor(false);
    setRichTextEditorTarget(null);
  };

  const renderRightPanel = () => {
    if (selectedAttachment) {
      switch (selectedAttachment.type) {
        case 'audio':
          return (
            <VoiceoverSettingsPanel
              key={selectedAttachment.subtitleId}
              subtitleId={selectedAttachment.subtitleId}
            />
          );
        case 'soundEffect':
          return (
            <SoundEffectSettingsPanel
              key={selectedAttachment.subtitleId}
              subtitleId={selectedAttachment.subtitleId}
            />
          );
        case 'backgroundMusic':
          return (
            <BackgroundMusicSettingsPanel />
          );
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
    if (!panelContent) {
      return null;
    }
    
    return (
      <div className="border-l border-border-secondary">
        {/* --- (修改) 用 Suspense 包裹 --- */}
        <Suspense fallback={null}>
          {panelContent}
        </Suspense>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-bg-primary text-text-primary overflow-hidden flex flex-col">
      <HeaderBar />

      <div className="flex-1 flex overflow-hidden">
        
        {!collapsed && (
          <div className="border-r border-border-secondary">
            <LeftSidebar />
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          
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

      {/* --- (修改) 用 Suspense 包裹弹窗 --- */}
      <Suspense fallback={null}>
        {activeDialog === 'broll' && (
          <BrollDialog
            open={true}
            onClose={closeDialog}
            targetSubtitleId={dialogTargetSubtitleId || ''}
          />
        )}
        
        {activeDialog === 'voiceover' && (
          <VoiceoverDialog
            open={true}
            onClose={closeDialog}
            targetSubtitleId={dialogTargetSubtitleId || ''}
          />
        )}
        {activeDialog === 'insertVideo' && (
          <InsertVideoDialog />
        )}

      </Suspense>
      <GlobalModals />
    </div>
  );
}