import { useVoiceoverStore } from '@/stores/useVoiceoverStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { formatDuration } from '@/utils/audioUtils';
import { ArrowLeft, Trash2, Volume2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface VoiceoverEditViewProps {
  onApply: () => void;
  targetSubtitleId: string;
}

export function VoiceoverEditView({ onApply, targetSubtitleId }: VoiceoverEditViewProps) {
  const { t } = useTranslation();
  const { selectedAudio, setDialogView } = useVoiceoverStore();
  const { removeSubtitleAudio } = useSubtitleStore();

  if (!selectedAudio) return null;

  const handleBack = () => {
    setDialogView('source');
  };

  const handleDelete = () => {
    removeSubtitleAudio(targetSubtitleId);
    setDialogView('source');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border-secondary flex-shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">{t('返回')}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="relative">
          <div className="aspect-video rounded-lg overflow-hidden border-2 border-border-secondary bg-bg-tertiary flex items-center justify-center text-text-secondary">
            <Volume2 size={64} />
          </div>

          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors"
            title={t('删除配音')}
          >
            <Trash2 size={18} />
          </button>

          <div className="mt-2 text-sm">
            <div className="text-text-primary font-medium truncate">
              {selectedAudio.name}
            </div>
            <div className="text-text-secondary">
              {t('时长:')} {formatDuration(selectedAudio.duration)}
            </div>
          </div>
        </div>

      </div>

      <div className="p-4 border-t border-border-secondary flex-shrink-0">
        <button
          onClick={onApply}
          className="w-full py-3 rounded-lg bg-accent-purple hover:bg-accent-purple/90 text-white font-medium transition-colors"
        >
          {t('应用')}
        </button>
      </div>
    </div>
  );
}