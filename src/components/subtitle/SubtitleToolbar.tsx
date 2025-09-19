import { useProjectStore } from '@/stores/useProjectStore';
import { useUIStore } from '@/stores/useUIStore';

export function SubtitleToolbar() {
  const { 
    deleteSubtitles,
    duplicateSubtitle,
    splitSubtitle,
    mergeSubtitles,
    currentTime
  } = useProjectStore();
  
  const { 
    selectedSubtitleIds,
    clearSelectedSubtitles,
    setEditingSubtitle
  } = useUIStore();

  const hasSelection = selectedSubtitleIds.length > 0;
  const singleSelection = selectedSubtitleIds.length === 1;
  const multipleSelection = selectedSubtitleIds.length > 1;

  const handleDelete = () => {
    if (hasSelection) {
      deleteSubtitles(selectedSubtitleIds);
      clearSelectedSubtitles();
    }
  };

  const handleDuplicate = () => {
    if (singleSelection) {
      duplicateSubtitle(selectedSubtitleIds[0]);
    }
  };

  const handleSplit = () => {
    if (singleSelection) {
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

  return (
    <div className="p-3 border-b border-border-secondary bg-bg-secondary">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleEdit}
          disabled={!singleSelection}
          className="px-3 py-1.5 text-xs bg-accent-purple hover:bg-accent-purple/80 disabled:bg-bg-tertiary disabled:text-text-disabled text-white rounded transition-colors"
        >
          编辑
        </button>
        
        <button
          onClick={handleDuplicate}
          disabled={!singleSelection}
          className="px-3 py-1.5 text-xs bg-bg-tertiary hover:bg-bg-elevated disabled:bg-bg-tertiary/50 disabled:text-text-disabled text-text-primary rounded transition-colors"
        >
          复制
        </button>
        
        <button
          onClick={handleSplit}
          disabled={!singleSelection}
          className="px-3 py-1.5 text-xs bg-bg-tertiary hover:bg-bg-elevated disabled:bg-bg-tertiary/50 disabled:text-text-disabled text-text-primary rounded transition-colors"
        >
          分割
        </button>
        
        <button
          onClick={handleMerge}
          disabled={!multipleSelection}
          className="px-3 py-1.5 text-xs bg-bg-tertiary hover:bg-bg-elevated disabled:bg-bg-tertiary/50 disabled:text-text-disabled text-text-primary rounded transition-colors"
        >
          合并
        </button>
        
        <div className="w-px h-4 bg-border-secondary" />
        
        <button
          onClick={handleDelete}
          disabled={!hasSelection}
          className="px-3 py-1.5 text-xs bg-accent-red/10 hover:bg-accent-red/20 disabled:bg-bg-tertiary/50 disabled:text-text-disabled text-accent-red rounded transition-colors"
        >
          删除
        </button>
        
        <button
          onClick={clearSelectedSubtitles}
          disabled={!hasSelection}
          className="px-3 py-1.5 text-xs bg-bg-tertiary hover:bg-bg-elevated disabled:bg-bg-tertiary/50 disabled:text-text-disabled text-text-tertiary rounded transition-colors"
        >
          取消选择
        </button>
      </div>
    </div>
  );
}