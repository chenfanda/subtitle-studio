import { useMediaStore } from '@/stores/useMediaStore';
import { StickerLibrary } from './StickerLibrary';
import { GifsLibrary } from './GifsLibrary';
import { MediaSearch } from './MediaSearch';

export function MediaPanel() {
  const { activeMediaType, setActiveMediaType } = useMediaStore();

  const categories = [
    { id: 'sticker', name: '贴纸' },
    { id: 'gif', name: 'GIF' }
  ] as const;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border-secondary">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveMediaType(category.id)}
                className={`
                  flex-shrink-0 py-3 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap
                  ${activeMediaType === category.id
                    ? 'text-accent-purple border-accent-purple'
                    : 'text-text-secondary border-transparent hover:text-text-primary'
                  }
                `}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4 border-b border-border-secondary">
        <MediaSearch />
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {activeMediaType === 'sticker' ? <StickerLibrary /> : <GifsLibrary />}
      </div>
    </div>
  );
}