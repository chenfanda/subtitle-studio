import { useUIStore } from '@/stores/useUIStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { StickerLibrary } from './StickerLibrary';
import { GifsLibrary } from './GifsLibrary';
import { MediaUpload } from './MediaUpload';

export function MediaPanel() {
  const { editingSubtitleId, selectedSubtitleIds } = useUIStore();
  const { subtitles } = useProjectStore();
  
  // 优先使用编辑中的字幕，其次使用选中的第一个字幕
  const currentSubtitle = (() => {
    // 1. 如果正在编辑某个字幕（双击进入编辑模式）
    if (editingSubtitleId) {
      return subtitles.find(s => s.id === editingSubtitleId) || null;
    }
    
    // 2. 如果选中了字幕（单击选中）
    if (selectedSubtitleIds.length > 0) {
      return subtitles.find(s => s.id === selectedSubtitleIds[0]) || null;
    }
    
    // 3. 都没有，返回 null
    return null;
  })();

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