import { useAudioStore, useActiveSfxCategory } from '@/stores/useAudioStore';
import { SFX_CATEGORIES } from '@/constants/sfxCategories';
import { useTranslation } from '@/hooks/useTranslation';

export function SoundEffectCategoryTabs() {
  const { t } = useTranslation();
  const activeSfxCategory = useActiveSfxCategory();
  const setActiveSfxCategory = useAudioStore((state) => state.setActiveSfxCategory);

  return (
    <div className="p-4 border-b border-border-secondary">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {SFX_CATEGORIES.map((category) => {
          const isActive = activeSfxCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setActiveSfxCategory(category.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-colors
                flex-shrink-0
                ${isActive
                  ? 'bg-accent-purple text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
                }
              `}
            >
              {t(category.name)}
            </button>
          );
        })}
      </div>
    </div>
  );
}