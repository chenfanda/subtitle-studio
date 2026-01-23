import { useMediaStore } from '@/stores/useMediaStore';
import type { SubtitleItem } from '@/types/subtitle';
import { useTranslation } from '@/hooks/useTranslation';

export function GifsLibrary({ currentSubtitle }: { currentSubtitle: SubtitleItem | null }) {
  const { t } = useTranslation();
  const { presetMedia, uploadedMedia, placeOnTimeline } = useMediaStore();

  const gifs = [
    ...presetMedia.filter((m) => m.type === 'gif'),
    ...uploadedMedia.filter((m) => m.type === 'gif'),
  ];

  if (gifs.length === 0) return null;

  return (
    <div className="p-4">
      <h3 className="text-xs font-medium text-text-secondary mb-3 uppercase tracking-wider">{t('GIF 动图')}</h3>
      <div className="grid grid-cols-3 gap-2">
        {gifs.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              const start = currentSubtitle?.startTime ?? 0;
              placeOnTimeline(item, start, start + 3000);
            }}
            className="aspect-square bg-bg-secondary rounded-lg hover:ring-2 hover:ring-accent-purple transition-all p-2 flex items-center justify-center group"
          >
            <img src={item.url} alt="" className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
}