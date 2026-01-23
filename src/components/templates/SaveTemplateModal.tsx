import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { useTranslation } from '@/hooks/useTranslation';

interface SaveTemplateModalProps {
  onClose: () => void;
  onSave: (name: string) => void;
  initialName?: string;
}

export function SaveTemplateModal({
  onClose,
  onSave,
  initialName = '自定义模板'
}: SaveTemplateModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(t(initialName));

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Modal title={t('保存预设')} isOpen={true} onClose={onClose}>
      <div className="p-4 space-y-4">
        <div>
          <label
            htmlFor="templateName"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            {t('模板名称')}
          </label>
          <input
            id="templateName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-lg text-sm text-text-primary focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-bg-tertiary text-text-primary hover:bg-border-secondary transition-colors"
          >
            {t('取消')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-accent-purple text-white hover:bg-accent-purple/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('保存')}
          </button>
        </div>
      </div>
    </Modal>
  );
}