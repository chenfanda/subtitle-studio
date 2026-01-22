import React from 'react';
// 1. (已遵照要求) 导入 lucide-react 图标
import { List, ListVideo } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { useTranslation } from '@/hooks/useTranslation';

// 2. (新增) 从 useUIStore 导入我们约定的类型
type ClipTask = ReturnType<typeof useUIStore.getState>['activeClipTask'];

interface ClipsTaskSwitcherProps {
  activeTask: ClipTask;
  onTaskChange: (task: ClipTask) => void;
}

export function ClipsTaskSwitcher({
  activeTask,
  onTaskChange
}: ClipsTaskSwitcherProps) {

  const { t } = useTranslation();

  const tasks: { name: ClipTask; label: string; icon: React.ElementType }[] = [
    { name: 'subtitles', label: t('字幕序列'), icon: List },
    { name: 'videos', label: t('视频序列'), icon: ListVideo },
  ];

  return (
    <div className="flex items-center p-2 border-b border-border-secondary bg-bg-primary">
      {tasks.map((task) => (
        <button
          key={task.name}
          onClick={() => onTaskChange(task.name)}
          className={`
            flex-1 flex items-center justify-center gap-1.5 p-2 rounded-md
            text-sm transition-colors
            ${activeTask === task.name
              ? 'bg-bg-elevated text-text-primary font-medium'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
            }
          `}
        >
          <task.icon size={16} />
          <span>{task.label}</span>
        </button>
      ))}
    </div>
  );
}