import { useEffect } from 'react';
import { useBrollStore } from '@/stores/useBrollStore';
import { BrollSearchView } from './BrollSearchView';
import { BrollEditView } from './BrollEditView';
import { useTranslation } from '@/hooks/useTranslation';

interface BrollDialogProps {
  open: boolean;
  onClose: () => void;
  targetSubtitleId: string;
}

export default function BrollDialog({ open, onClose, targetSubtitleId }: BrollDialogProps) {
  const { t } = useTranslation();
  const { dialogView, applyToSubtitle, resetDialog } = useBrollStore();

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
          <h3 className="text-lg font-semibold text-text-primary">{t('B-roll素材')}</h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {dialogView === 'search' && <BrollSearchView />}
          {dialogView === 'edit' && (
            <BrollEditView
              onApply={handleApply}
              targetSubtitleId={targetSubtitleId}
            />
          )}
        </div>
      </div>
    </div>
  );
}