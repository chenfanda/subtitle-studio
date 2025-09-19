import { useUIStore, useActivePanel } from '@/stores/useUIStore';
import type { PanelType } from '@/types/ui';

interface ToolItem {
  id: PanelType;
  icon: string;
  label: string;
  shortcut?: string;
}

const TOOLS: ToolItem[] = [
  { id: 'clips', icon: '✂️', label: '剪辑工具', shortcut: 'C' },
  { id: 'subtitles', icon: '💬', label: '字幕编辑', shortcut: 'U' },
  { id: 'media', icon: '🖼️', label: '图片素材', shortcut: 'M' },
  { id: 'audio', icon: '🎵', label: '音频工具', shortcut: 'A' },
  { id: 'text', icon: 'T', label: '文字工具', shortcut: 'T' },
  { id: 'broll', icon: '➕', label: '媒体素材', shortcut: 'B' }
];

export function VerticalToolbar() {
  const activePanel = useActivePanel();
  const { setActivePanel } = useUIStore();

  return (
    <div className="w-15 bg-bg-tertiary flex flex-col items-center py-4 space-y-2 border-r border-border-secondary">
      {TOOLS.map((tool) => {
        const isActive = activePanel === tool.id;
        
        return (
          <button
            key={tool.id}
            onClick={() => setActivePanel(tool.id)}
            className={`
              relative w-12 h-12 rounded-lg flex items-center justify-center text-xl 
              transition-all duration-normal hover:scale-105 group
              ${isActive 
                ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/20' 
                : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
              }
            `}
            title={`${tool.label} ${tool.shortcut ? `(${tool.shortcut})` : ''}`}
            aria-label={tool.label}
            aria-pressed={isActive}
          >
            <span className="select-none">{tool.icon}</span>
            
            {isActive && (
              <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-full" />
            )}
            
            {!isActive && (
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-10 bg-white transition-opacity duration-normal" />
            )}
          </button>
        );
      })}
      
      <div className="flex-1" />
      
      <div className="w-full h-px bg-border-secondary mx-2" />
      
      <button
        className="w-10 h-10 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors duration-normal"
        title="面板设置"
        onClick={() => {
          console.log('Panel settings');
        }}
      >
        ⚙️
      </button>
    </div>
  );
}