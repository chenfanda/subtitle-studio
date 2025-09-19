import React from 'react';
import { 
  Scissors, 
  Image, 
  Circle,
  AudioWaveform, 
  Type, 
  Plus,
  Film 
} from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import type { LeftPanelTab } from '@/types/ui';

const tools = [
  { id: 'edit' as LeftPanelTab, icon: Scissors, label: '剪辑' },
  { id: 'text' as LeftPanelTab, icon: Image, label: '字幕' },
  { id: 'template' as LeftPanelTab, icon: Circle, label: '模板' },
  { id: 'audio' as LeftPanelTab, icon: AudioWaveform, label: '音频' },
  { id: 'text' as LeftPanelTab, icon: Type, label: '文字' },
  { id: 'media' as LeftPanelTab, icon: Plus, label: '媒体' },
  { id: 'broll' as LeftPanelTab, icon: Film, label: 'B-roll' },
];

export const VerticalToolbar: React.FC = () => {
  const { leftPanel, setLeftPanelTab } = useUIStore();

  return (
    <div className="w-15 bg-gray-750 flex flex-col py-2">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = leftPanel.activeTab === tool.id;
        
        return (
          <button
            key={tool.id}
            onClick={() => setLeftPanelTab(tool.id)}
            className={`
              relative flex flex-col items-center justify-center p-3 m-1 rounded-lg
              transition-all duration-200 group
              ${isActive 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }
            `}
            title={tool.label}
          >
            <Icon size={20} />
            
            {/* 激活状态指示器 */}
            {isActive && (
              <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-l"></div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default VerticalToolbar;