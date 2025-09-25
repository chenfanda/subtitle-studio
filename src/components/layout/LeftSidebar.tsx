import { VerticalToolbar } from '@/components/sidebar/SidebarTabs';
import { SubtitlePanel } from '@/components/subtitle/SubtitlePanel';
import { TextPanel } from '@/components/text/TextPanel';
import { TemplatePanel } from '@/components/templates/TemplatePanel';
import { AudioPanel } from '@/components/audio/AudioPanel';
import { useUIStore } from '@/stores/useUIStore';

export function LeftSidebar() {
  const leftPanelWidth = useUIStore((state) => state.leftPanelWidth);
  const leftPanelCollapsed = useUIStore((state) => state.leftPanelCollapsed);
  const activePanel = useUIStore((state) => state.activePanel);

  if (leftPanelCollapsed) return null;

  return (
    <div 
      className="bg-bg-secondary flex border-r border-border-primary overflow-hidden"
      style={{ width: leftPanelWidth }}
    >
      <VerticalToolbar />
      
      <div className="flex-1 overflow-hidden">
        {activePanel === 'clips' && <ClipsPanel />}
        {activePanel === 'subtitles' && <SubtitlePanel />}
        {activePanel === 'text' && <TextPanel />}
        {activePanel === 'templates' && <TemplatePanel />}
        {activePanel === 'media' && <MediaPanel />}
        {activePanel === 'audio' && <AudioPanel />}
        {activePanel === 'broll' && <BRollPanel />}
      </div>
    </div>
  );
}

function ClipsPanel() {
  return (
    <div className="h-full flex items-center justify-center text-text-secondary">
      <div className="text-center">
        <div className="text-4xl mb-2">✂️</div>
        <div>剪辑面板</div>
        <div className="text-sm mt-1">即将实现</div>
      </div>
    </div>
  );
}

function MediaPanel() {
  return (
    <div className="h-full flex items-center justify-center text-text-secondary">
      <div className="text-center">
        <div className="text-4xl mb-2">🖼️</div>
        <div>媒体面板</div>
        <div className="text-sm mt-1">即将实现</div>
      </div>
    </div>
  );
}

function BRollPanel() {
  return (
    <div className="h-full flex items-center justify-center text-text-secondary">
      <div className="text-center">
        <div className="text-4xl mb-2">🎬</div>
        <div>B-roll面板</div>
        <div className="text-sm mt-1">即将实现</div>
      </div>
    </div>
  );
}