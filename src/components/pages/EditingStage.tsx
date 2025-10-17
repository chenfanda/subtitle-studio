import { HeaderBar } from '../layout/HeaderBar';
import { LeftSidebar } from '../layout/LeftSidebar';
import { VideoArea } from '../layout/VideoArea';
import { VideoControls } from '../video/VideoControls';
import { TimelineArea } from '../layout/TimelineArea';
import { RichTextEditor } from '../common/RichTextEditor';
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
      {/* 顶部标题栏 */}
      <HeaderBar />
      
      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧边栏 */}
        {!collapsed && <LeftSidebar />}
        
        {/* 中间区域：视频 + 控制栏 + 时间轴 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 上方区域：视频画面 + 富文本编辑器（与视频画面等高） */}
          <div className="flex-1 flex overflow-hidden">
            {/* 视频画面区域 */}
            <div className="flex-1 overflow-hidden">
              <VideoArea />
            </div>
            
            {/* 右侧富文本编辑器（与视频画面等高） */}
            {showRichTextEditor && richTextEditorTarget && (
              <RichTextEditor
                targetType={richTextEditorTarget.type}
                targetId={richTextEditorTarget.id}
                onClose={handleCloseRichTextEditor}
              />
            )}
          </div>
          
          {/* 播放控制栏（固定在视频下方、时间轴上方） */}
          <div className="h-20 bg-gray-800 flex-shrink-0 border-t-2 border-gray-600">
            <VideoControls />
          </div>
          
          {/* 时间轴区域（可折叠） */}
          {!timelineCollapsed && (
            <div className="h-45 border-t border-border-primary flex-shrink-0">
              <TimelineArea />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}