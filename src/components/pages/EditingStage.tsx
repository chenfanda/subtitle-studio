import { HeaderBar } from '../layout/HeaderBar';
import { LeftSidebar } from '../layout/LeftSidebar';
import { VideoArea } from '../layout/VideoArea';
import { VideoControls } from '../video/VideoControls';
import { TimelineArea } from '../layout/TimelineArea';
import { RichTextEditor } from '../common/RichTextEditor';
import { AudioPlayer } from '../audio/AudioPlayer';
import { useLeftPanelCollapsed, useTimelineCollapsed } from '@/stores/useUIStore';
import { useUIStore } from '@/stores/useUIStore';

export function EditingStage() {
  const collapsed = useLeftPanelCollapsed();
  const timelineCollapsed = useTimelineCollapsed();
  const { 
    showRichTextEditor, 
    richTextEditorTarget,
    setShowRichTextEditor,
    setRichTextEditorTarget 
  } = useUIStore();

  const handleCloseRichTextEditor = () => {
    setShowRichTextEditor(false);
    setRichTextEditorTarget(null);
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
            
            {showRichTextEditor && richTextEditorTarget && (
              <RichTextEditor
                targetType={richTextEditorTarget.type}
                targetId={richTextEditorTarget.id}
                onClose={handleCloseRichTextEditor}
              />
            )}
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