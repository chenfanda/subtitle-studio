import { ClipSubtitleList } from './ClipSubtitleList';


export function VideoSequencePanel() {
  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* 2. 使用统一的列表来管理和剪切片段 */}
      <div className="flex-1 overflow-auto">
        <ClipSubtitleList />
      </div>
    </div>
  );
}