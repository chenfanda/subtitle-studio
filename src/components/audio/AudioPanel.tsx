import { useAudioStore, useActiveCategory } from '@/stores/useAudioStore';
import { AudioLibrary } from './AudioLibrary';

export function AudioPanel() {
  const activeCategory = useActiveCategory();
  const { setActiveCategory } = useAudioStore();

  const categories = [
    { id: 'like', name: 'Like' },
    { id: 'epic', name: 'Epic' },
    { id: 'ambient', name: 'Ambient' },
    { id: 'acoustic', name: 'Acoustic' },
    { id: 'electronic', name: 'Electronic' },
    { id: 'custom', name: '自定义' }
  ] as const;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border-secondary">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id as any)}
                className={`
                  flex-shrink-0 py-3 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap
                  ${activeCategory === category.id
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
      
      <div className="flex-1 overflow-y-auto">
        <AudioLibrary />
      </div>
    </div>
  );
}