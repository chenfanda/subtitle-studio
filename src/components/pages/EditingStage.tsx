import { HeaderBar } from '../layout/HeaderBar';
import { LeftSidebar } from '../layout/LeftSidebar';
import { VideoArea } from '../layout/VideoArea';
import { VideoControls } from '../video/VideoControls';
import { TimelineArea } from '../layout/TimelineArea';
import { RichTextEditor } from '../common/RichTextEditor';
import { AudioPlayer } from '../audio/AudioPlayer';
import { AudioSettingsPanel } from '../audio/AudioSettingsPanel';
import { 
  useLeftPanelCollapsed, 
  useTimelineCollapsed,
  useUIStore,
  useSelectedAttachment 
} from '@/stores/useUIStore';

export function EditingStage() {
  const collapsed = useLeftPanelCollapsed();
  const timelineCollapsed = useTimelineCollapsed();
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
            <AudioSettingsPanel
              key={selectedAttachment.subtitleId}
              subtitleId={selectedAttachment.subtitleId}
            />
          );
        // case 'broll':
        //   return <BrollSettingsPanel ... />;
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

  return (
    <div className="h-screen w-screen bg-bg-primary text-text-primary overflow-hidden flex flex-col">
      <HeaderBar />
      
      <div className="flex-1 flex overflow-hidden">
        {!collapsed && <LeftSidebar />}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <VideoArea />
            </div>
            
            {renderRightPanel()}

          </div>
          
          <div className="h-20 bg-gray-800 flex-shrink-0 border-t-2 border-gray-600">
            <VideoControls />
          </div>
          
          {!timelineCollapsed && (
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