import { VideoSequenceToolbar } from './VideoSequenceToolbar';
import { VideoSequenceList } from './VideoSequenceList';

/**
 * ClipsPanel 的 "视频序列" 模式。
 * (已更新) 集成了工具栏和列表组件。
 */
export function VideoSequencePanel() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 1. 视频序列工具栏 (包含 "添加视频插入" 按钮) */}
      <VideoSequenceToolbar />

      {/* 2. 视频序列列表 (显示所有已添加的片段) */}
      <div className="flex-1 overflow-auto">
        <VideoSequenceList />
      </div>
    </div>
  );
}