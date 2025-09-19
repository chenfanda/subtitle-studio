import { SubtitleList } from './SubtitleList';
import { SubtitleEditor } from './SubtitleEditor';
import { SubtitleToolbar } from './SubtitleToolbar';
import { useUIStore } from '@/stores/useUIStore';

export function SubtitlePanel() {
  const { editingSubtitleId, selectedSubtitleIds } = useUIStore();

  return (
    <div className="h-full flex flex-col">
      {selectedSubtitleIds.length > 0 && !editingSubtitleId && (
        <SubtitleToolbar />
      )}
      
      <div className="flex-1 overflow-hidden">
        <SubtitleList />
      </div>
      
      {editingSubtitleId && (
        <div className="flex-shrink-0">
          <SubtitleEditor />
        </div>
      )}
    </div>
  );
}