import { useMemo } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useUIStore } from '@/stores/useUIStore';

// 1. 导入 lucide-react 图标
import {
  PenSquare,    // 编辑 (虽然我们保留了文本，但备用)
  Copy,         // 复制
  PlusSquare,   // 插入片段
  Scissors,     // 分割
  Combine,      // 合并
  Trash2,       // 删除
  XCircle,      // 取消选择
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export function SubtitleToolbar() {
  const { t } = useTranslation();
  const { currentTime } = useProjectStore();

  const {
    subtitles,
    deleteSubtitles,
    duplicateSubtitle,
    insertBlankSubtitle,
    splitSubtitle,
    mergeSubtitles
  } = useSubtitleStore();

  const {
    selectedSubtitleIds,
    clearSelectedSubtitles,
    setEditingSubtitle
  } = useUIStore();

  const hasSelection = selectedSubtitleIds.length > 0;
  const singleSelection = selectedSubtitleIds.length === 1;
  const multipleSelection = selectedSubtitleIds.length > 1;

  const canSplit = useMemo(() => {
    if (!singleSelection) return false;

    const subtitle = subtitles.find(s => s.id === selectedSubtitleIds[0]);
    if (!subtitle) return false;

    const currentTimeMs = currentTime * 1000;

    return currentTimeMs > subtitle.startTime && currentTimeMs < subtitle.endTime;

  }, [selectedSubtitleIds, singleSelection, subtitles, currentTime]);

  // --- 所有 handle 函数保持不变 ---
  const handleDelete = () => {
    if (hasSelection) {
      clearSelectedSubtitles();
      setTimeout(() => {
        deleteSubtitles(selectedSubtitleIds);
      }, 0);
    }
  };

  const handleDuplicate = () => {
    if (singleSelection) {
      duplicateSubtitle(selectedSubtitleIds[0]);
    }
  };

  const handleInsertBlank = () => {
    if (singleSelection) {
      insertBlankSubtitle(selectedSubtitleIds[0]);
    }
  };

  const handleSplit = () => {
    if (canSplit) {
      const currentTimeMs = currentTime * 1000;
      splitSubtitle(selectedSubtitleIds[0], currentTimeMs);
    }
  };

  const handleMerge = () => {
    if (multipleSelection) {
      mergeSubtitles(selectedSubtitleIds);
      clearSelectedSubtitles();
    }
  };

  const handleEdit = () => {
    if (singleSelection) {
      setEditingSubtitle(selectedSubtitleIds[0]);
    }
  };
  // --- handle 函数结束 ---


  // 2. 定义一个通用的图标按钮样式和大小
  const iconButtonClass = "p-1.5 rounded text-text-primary hover:bg-bg-tertiary disabled:text-text-disabled disabled:hover:bg-transparent transition-colors";
  const iconSize = 18; // 图标大小 (16, 18, 20 都是常用值)

  return (
    <div className="p-3 border-b border-border-secondary bg-bg-primary">
      {/* 3. 使用新的图标按钮布局 */}
      <div className="flex items-center gap-1.5 flex-wrap">

        {/* 主要操作: 编辑 (保留文本) */}
        <button
          onClick={handleEdit}
          disabled={!singleSelection}
          title={t("编辑")}
          className="px-3 py-1.5 text-xs bg-accent-purple hover:bg-accent-purple/80 disabled:bg-bg-tertiary disabled:text-text-disabled text-white rounded transition-colors"
        >
          {t("编辑")}
        </button>

        {/* 次要操作组 1: 创编 */}
        <button
          onClick={handleDuplicate}
          disabled={!singleSelection}
          title={t("复制")}
          className={iconButtonClass}
        >
          <Copy size={iconSize} />
        </button>

        <button
          onClick={handleInsertBlank}
          disabled={!singleSelection}
          title={t("插入片段")}
          className={iconButtonClass}
        >
          <PlusSquare size={iconSize} />
        </button>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-border-secondary mx-1" />

        {/* 次要操作组 2: 结构 */}
        <button
          onClick={handleSplit}
          disabled={!canSplit}
          title={t("分割")}
          className={iconButtonClass}
        >
          <Scissors size={iconSize} />
        </button>

        <button
          onClick={handleMerge}
          disabled={!multipleSelection}
          title={t("合并")}
          className={iconButtonClass}
        >
          <Combine size={iconSize} />
        </button>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-border-secondary mx-1" />

        {/* 破坏性操作: 删除 */}
        <button
          onClick={handleDelete}
          disabled={!hasSelection}
          title={t("删除")}
          className="p-1.5 rounded text-accent-red hover:bg-accent-red/10 disabled:text-text-disabled disabled:hover:bg-transparent transition-colors"
        >
          <Trash2 size={iconSize} />
        </button>

        {/* 三级操作: 取消 */}
        <button
          onClick={clearSelectedSubtitles}
          disabled={!hasSelection}
          title={t("取消选择")}
          className="p-1.5 rounded text-text-tertiary hover:bg-bg-tertiary disabled:text-text-disabled disabled:hover:bg-transparent transition-colors"
        >
          <XCircle size={iconSize} />
        </button>

      </div>
    </div>
  );
}