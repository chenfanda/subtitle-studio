import { useEffect } from 'react'; 
import { useUIStore } from '@/stores/useUIStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useMediaStore } from '@/stores/useMediaStore'; 
import { StickerLibrary } from './StickerLibrary';
import { GifsLibrary } from './GifsLibrary';
import { MediaUpload } from './MediaUpload';

export function MediaPanel() {
  const { editingSubtitleId, selectedSubtitleIds } = useUIStore();
  const { subtitles } = useSubtitleStore();
  

  const loadPresets = useMediaStore(state => state.loadPresets);


  useEffect(() => {
    loadPresets(); 
  }, [loadPresets]);

  const currentSubtitle = (() => {
    if (editingSubtitleId) return subtitles.find(s => s.id === editingSubtitleId) || null;
    if (selectedSubtitleIds.length > 0) return subtitles.find(s => s.id === selectedSubtitleIds[0]) || null;
    return null;
  })();

  return (
    <div className="h-full flex flex-col bg-bg-primary">
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