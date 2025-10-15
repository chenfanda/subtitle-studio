import { HeaderBar } from '../layout/HeaderBar';
import { LeftSidebar } from '../layout/LeftSidebar';
import { VideoArea } from '../layout/VideoArea';
import { TimelineArea } from '../layout/TimelineArea';
import { useLeftPanelCollapsed } from '@/stores/useUIStore';

export function EditingStage() {
  const collapsed = useLeftPanelCollapsed();

  return (
    <div className="h-screen w-screen bg-bg-primary text-text-primary overflow-hidden flex flex-col">
      {/* 顶部标题栏 */}
      <HeaderBar />
      
      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧边栏 */}
        {!collapsed && <LeftSidebar />}
        
        {/* 主编辑区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 视频预览区域 - 只减去时间轴高度，让VideoArea自己管理控制栏 */}
          <div 
            className="overflow-hidden"
            style={{ height: 'calc(100% - 180px)' }}
          >
            <VideoArea />
          </div>
          
          {/* 时间轴区域 - 固定180px高度 */}
          <div className="h-45 border-t border-border-primary flex-shrink-0">
            <TimelineArea />
          </div>
        </div>
      </div>
    </div>
  );
}