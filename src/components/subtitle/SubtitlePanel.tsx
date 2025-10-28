import { SubtitleList } from './SubtitleList';
import { SubtitleToolbar } from './SubtitleToolbar';
import { useUIStore } from '@/stores/useUIStore';

export function SubtitlePanel() {
  const { selectedSubtitleIds } = useUIStore();

  return (
    <div className="h-full flex flex-col">
      {selectedSubtitleIds.length > 0 && (
        <SubtitleToolbar />
      )}
      
      <div className="flex-1 overflow-hidden">
        <SubtitleList />
      </div>
    </div>
  );
}