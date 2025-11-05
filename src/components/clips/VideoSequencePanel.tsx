import { ClipSubtitleList } from './ClipSubtitleList';
import { VideoSequenceToolbar } from './VideoSequenceToolbar';

export function VideoSequencePanel() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 1. 恢复工具栏，用于“原子性”地添加新视频 */}
      <VideoSequenceToolbar />

      {/* 2. 使用统一的列表来管理和剪切片段 */}
      <div className="flex-1 overflow-auto">
        <ClipSubtitleList />
      </div>
    </div>
  );
}