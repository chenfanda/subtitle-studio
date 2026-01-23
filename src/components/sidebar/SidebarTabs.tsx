import { useUIStore, useActivePanel } from '@/stores/useUIStore';
import type { PanelType } from '@/types/ui';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Scissors,
  MessageSquareText,
  Type,
  Sparkles,
  Image,
  AudioWaveform,
  Film
} from 'lucide-react';

interface ToolItem {
  id: PanelType;
  icon: React.ElementType; 
  label: string;
  shortcut?: string;
}

const TOOLS: ToolItem[] = [
  { id: 'clips', icon: Scissors, label: '剪辑工具', shortcut: 'C' },
  { id: 'subtitles', icon: MessageSquareText, label: '字幕编辑', shortcut: 'U' },
  { id: 'text', icon: Type, label: '文字元素', shortcut: 'T' },
  { id: 'templates', icon: Sparkles, label: '文字模板', shortcut: 'E' },
  { id: 'media', icon: Image, label: '媒体素材', shortcut: 'M' },
  { id: 'audio', icon: AudioWaveform, label: '音频工具', shortcut: 'A' },
  { id: 'broll', icon: Film, label: 'B-roll素材', shortcut: 'B' }
];

export function VerticalToolbar() {
  const activePanel = useActivePanel();
  const { setActivePanel } = useUIStore();
  const { t } = useTranslation();

  return (
    // (移除了 border-r，因为 LeftSidebar.tsx 父组件已经有了)
    <div className="w-15 bg-bg-primary flex flex-col items-center py-4 space-y-2">
      {TOOLS.map((tool) => {
        const isActive = activePanel === tool.id;
        const Icon = tool.icon; // 将图标组件赋值给大写变量

        return (
          <button
            key={tool.id}
            onClick={() => setActivePanel(tool.id)}
            className={`
              relative w-12 h-12 rounded-lg flex items-center justify-center 
              transition-all duration-normal hover:scale-105 group
              ${isActive
                ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/20'
                : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
              }
            `}
            title={`${t(tool.label)} ${tool.shortcut ? `(${tool.shortcut})` : ''}`}
            aria-label={t(tool.label)}
            aria-pressed={isActive}
          >
            {/* (渲染图标组件) */}
            <Icon className="w-6 h-6" strokeWidth={1.5} />

            {!isActive && (
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-10 bg-white transition-opacity duration-normal" />
            )}
          </button>
        );
      })}

      {/* (已删除) 
        <div className="flex-1" />  // <-- 导致布局 bug 的元素
        <div className="w-full h-px bg-border-secondary mx-2" />
        <button ...>⚙️</button> // <-- 多余的设置按钮
      */}
    </div>
  );
}