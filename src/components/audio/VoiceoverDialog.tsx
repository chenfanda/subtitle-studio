import { useEffect } from 'react';
import { useVoiceoverStore } from '@/stores/useVoiceoverStore';
import { VoiceoverSourceView } from './VoiceoverSourceView';
import { VoiceoverEditView } from './VoiceoverEditView';

interface VoiceoverDialogProps {
  open: boolean;
  onClose: () => void;
  targetSubtitleId: string;
}

export function VoiceoverDialog({ open, onClose, targetSubtitleId }: VoiceoverDialogProps) {
  const { dialogView, applyToSubtitle, resetDialog } = useVoiceoverStore();

  useEffect(() => {
    if (!open) {
      resetDialog();
    }
  }, [open, resetDialog]);

  const handleApply = () => {
    applyToSubtitle(targetSubtitleId);
    onClose();
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-bg-secondary rounded-lg w-[600px] h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border-secondary flex-shrink-0">
          <h3 className="text-lg font-semibold text-text-primary">添加配音</h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {dialogView === 'source' && (
            <VoiceoverSourceView 
              targetSubtitleId={targetSubtitleId} 
            />
          )}
          {dialogView === 'edit' && (
            <VoiceoverEditView 
              onApply={handleApply}
              targetSubtitleId={targetSubtitleId}
            />
          )}
        </div>
      </div>
    </div>
  );
}