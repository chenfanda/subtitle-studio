import { BasicStylesTab } from './BasicStylesTab';
import { SocialMediaTab } from './SocialMediaTab';
import { TitleStylesTab } from './TitleStylesTab';
import { NoteStylesTab } from './NoteStylesTab';
import { useTextStyleStore, useSelectedTemplate } from '@/stores/useTextStyleStore';
import { useSelectedSubtitles } from '@/stores/useUIStore';

export function TextPanel() {
  const selectedTemplate = useSelectedTemplate();
  const selectedSubtitleIds = useSelectedSubtitles();
  const applyToSubtitle = useTextStyleStore((state) => state.applyToSubtitle);
  
  const hasSelection = selectedTemplate && selectedSubtitleIds.length > 0;

  const handleApply = () => {
    if (!selectedTemplate || selectedSubtitleIds.length === 0) return;
    
    selectedSubtitleIds.forEach(subtitleId => {
      applyToSubtitle(subtitleId);
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-0">
        <BasicStylesTab />
        <SocialMediaTab />
        <TitleStylesTab />
        <NoteStylesTab />
      </div>
      
      <div className="border-t border-border-secondary p-4">
        <button
          onClick={handleApply}
          disabled={!hasSelection}
          className={`
            w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
            ${hasSelection
              ? 'bg-accent-purple text-white hover:bg-accent-purple/90 shadow-lg'
              : 'bg-bg-tertiary text-text-secondary cursor-not-allowed'
            }
          `}
        >
          应用到选中字幕 ({selectedSubtitleIds.length})
        </button>
      </div>
    </div>
  );
}