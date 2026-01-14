import { useMediaStore } from '@/stores/useMediaStore';
import type { SubtitleItem } from '@/types/subtitle';

export function StickerLibrary({ currentSubtitle }: { currentSubtitle: SubtitleItem | null }) {
  // 从 Store 获取数据（现在 presetMedia 会在 loadPresets 执行后自动更新）
  const { presetMedia, uploadedMedia, placeOnTimeline } = useMediaStore();

  const stickers = [
    ...presetMedia.filter((m) => m.type === 'sticker'),
    ...uploadedMedia.filter((m) => m.type === 'sticker'),
  ];

  // 如果没有素材，可以返回 null 或者一个简单的提示
  if (stickers.length === 0) return null;

  return (
    <div className="p-4 border-b border-white/5">
      <h3 className="text-xs font-medium text-text-secondary mb-3 uppercase tracking-wider">贴纸库</h3>
      <div className="grid grid-cols-3 gap-2">
        {stickers.map((item) => (
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