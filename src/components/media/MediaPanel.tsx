import { useUIStore } from '@/stores/useUIStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { StickerLibrary } from './StickerLibrary';
import { GifsLibrary } from './GifsLibrary';
import { MediaUpload } from './MediaUpload';

export function MediaPanel() {
  const { editingSubtitleId } = useUIStore();
  const { subtitles } = useProjectStore();
  
  const currentSubtitle = editingSubtitleId 
    ? subtitles.find(s => s.id === editingSubtitleId) 
    : null;

  return (
    <div className="h-full flex flex-col bg-bg-secondary">
      <div className="p-4">
        <MediaUpload />
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <StickerLibrary currentSubtitle={currentSubtitle} />
        <GifsLibrary currentSubtitle={currentSubtitle} />
      </div>
    </div>
  );
}