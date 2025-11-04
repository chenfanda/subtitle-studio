import { useUIStore } from '@/stores/useUIStore';
import { ClipsTaskSwitcher } from './ClipsTaskSwitcher';
import { SubtitleSequencePanel } from './SubtitleSequencePanel';
import { VideoSequencePanel } from './VideoSequencePanel';

export function ClipsPanel() {
  // 1. 从 useUIStore (我们约定好要修改的) 获取状态
  const activeClipTask = useUIStore((state) => state.activeClipTask);
  const setActiveClipTask = useUIStore((state) => state.setActiveClipTask);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 2. 任务切换器 UI */}
      <ClipsTaskSwitcher
        activeTask={activeClipTask}
        onTaskChange={setActiveClipTask}
      />
      
      {/* 3. 根据状态，渲染两个面板之一 */}
      <div className="flex-1 overflow-auto">
        {activeClipTask === 'subtitles' && <SubtitleSequencePanel />}
        {activeClipTask === 'videos' && <VideoSequencePanel />}
      </div>
    </div>
  );
}