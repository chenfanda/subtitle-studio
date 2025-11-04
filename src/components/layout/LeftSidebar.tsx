import { VerticalToolbar } from '@/components/sidebar/SidebarTabs';
import { SubtitlePanel } from '@/components/subtitle/SubtitlePanel';
import { TextPanel } from '@/components/text/TextPanel';
import { TemplatePanel } from '@/components/templates/TemplatePanel';
import { AudioPanel } from '@/components/audio/AudioPanel';
import { MediaPanel } from '@/components/media/MediaPanel';
import { BrollPanel } from '@/components/broll/BrollPanel';
import { useUIStore } from '@/stores/useUIStore';

// 1. (新增) 导入我们新创建的 ClipsPanel 模块
import { ClipsPanel } from '@/components/clips/ClipsPanel';

export function LeftSidebar() {
  const leftPanelWidth = useUIStore((state) => state.leftPanelWidth);
  const leftPanelCollapsed = useUIStore((state) => state.leftPanelCollapsed);
  const activePanel = useUIStore((state) => state.activePanel);

  if (leftPanelCollapsed) return null;

  return (
    <div 
      // 📍 修复: 在这里添加了 h-full (保留原始文件中的注释)
      className="h-full bg-bg-primary flex border-r border-border-primary overflow-hidden"
      style={{ width: leftPanelWidth }}
    >
      <VerticalToolbar />
      
      <div className="flex-1 overflow-hidden">
        {/* 2. (已修改) 这一行现在将渲染我们导入的模块，而不是本地的占位符 */}
        {activePanel === 'clips' && <ClipsPanel />}
        {activePanel === 'subtitles' && <SubtitlePanel />}
        {activePanel === 'text' && <TextPanel />}
        {activePanel === 'templates' && <TemplatePanel />}
        {activePanel === 'media' && <MediaPanel />}
        {activePanel === 'audio' && <AudioPanel />}
        {activePanel === 'broll' && <BrollPanel />}  
      </div>
    </div>
  );
}

// 3. (已删除) 此处原有的本地占位符 function ClipsPanel() { ... } 已被移除