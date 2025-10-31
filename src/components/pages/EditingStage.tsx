import { HeaderBar } from '../layout/HeaderBar';
import { LeftSidebar } from '../layout/LeftSidebar';
import { VideoArea } from '../layout/VideoArea';
import { VideoControls } from '../video/VideoControls'; // 导入 VideoControls
import { TimelineArea } from '../layout/TimelineArea';
import { RichTextEditor } from '../common/RichTextEditor';
import { AudioPlayer } from '../audio/AudioPlayer';
import { VoiceoverSettingsPanel } from '../audio/VoiceoverSettingsPanel';
import { SoundEffectSettingsPanel } from '../audio/SoundEffectSettingsPanel';
import { BackgroundMusicSettingsPanel } from '../audio/BackgroundMusicSettingsPanel';
import { useProjectStore } from '@/stores/useProjectStore';
import { 
  useLeftPanelCollapsed, 
  useTimelineCollapsed,
  useUIStore,
  useSelectedAttachment 
} from '@/stores/useUIStore';

export function EditingStage() {
  const collapsed = useLeftPanelCollapsed();
  const timelineCollapsed = useTimelineCollapsed();
  const projectDuration = useProjectStore((state) => state.duration);
  const { 
    showRichTextEditor, 
    richTextEditorTarget,
    setShowRichTextEditor,
    setRichTextEditorTarget 
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
        {panelContent}
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

          {/* 时间轴区域: 保持不变 */}
          {!timelineCollapsed && (projectDuration > 0) && (
            <div className="h-45 border-t border-border-primary flex-shrink-0">
              <TimelineArea />
            </div>
          )}
        </div>
      </div>

      <AudioPlayer />
    </div>
  );
}