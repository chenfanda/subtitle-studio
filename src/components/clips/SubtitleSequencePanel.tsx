import { SubtitleToolbar } from '@/components/subtitle/SubtitleToolbar';
// 2. 导入您 README.md 中定义的 SubtitleList
import { SubtitleList } from '@/components/subtitle/SubtitleList';

/**
 * ClipsPanel 的 "字幕序列" 模式。
 * 它重用现有的 SubtitleToolbar 和 SubtitleList 组件。
 */
export function SubtitleSequencePanel() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 这里渲染了您现有的 SubtitleToolbar。
        它包含了所有字幕的编辑逻辑 (分割, 合并, 删除等)
      */}
      <SubtitleToolbar />
      
      {/* 这里渲染了字幕列表，将其包裹在一个可滚动的容器中。
      */}
      <div className="flex-1 overflow-auto">
        <SubtitleList />
      </div>
    </div>
  );
}