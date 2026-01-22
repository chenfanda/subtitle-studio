import { useState, useRef } from 'react';
import {
  useAudioStore,
  useActiveAudioTask,
  useActiveCategory,
  AudioTaskType
} from '@/stores/useAudioStore';
import { AudioLibrary } from './AudioLibrary';
import { VoiceoverTaskPanel } from './VoiceoverTaskPanel';
import { SoundEffectCategoryTabs } from './SoundEffectCategoryTabs';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';


import { useTranslation } from '@/hooks/useTranslation';

function BgmCategoryTabs() {
  const { t } = useTranslation();
  const [isHovering, setIsHovering] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div
      className="relative py-3 px-4 border-b border-border-secondary"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {isHovering && (
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-bg-tertiary transition-colors z-10"
        >
          <ChevronLeftIcon className="w-4 h-4 text-text-primary" />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide"
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id as any)}
            className={`
              flex-shrink-0 px-3 py-1.5 rounded-md border text-xs font-medium transition-all whitespace-nowrap
              bg-bg-secondary
              ${activeCategory === category.id
                ? 'border-accent-purple text-accent-purple'
                : 'border-border-secondary text-text-secondary hover:border-border-primary hover:text-text-primary'
              }
            `}
          >
            {t(category.name)}
          </button>
        ))}
      </div>

      {isHovering && (
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-bg-tertiary transition-colors z-10"
        >
          <ChevronRightIcon className="w-4 h-4 text-text-primary" />
        </button>
      )}
    </div>
  );
}


function AudioTaskToggle() {
  const activeAudioTask = useActiveAudioTask();
  const setActiveAudioTask = useAudioStore(state => state.setActiveAudioTask);
  const { t } = useTranslation();

  const tasks: { id: AudioTaskType; name: string }[] = [
    { id: 'voiceover', name: '字幕配音' },
    { id: 'bgm', name: '背景音乐' },
    { id: 'sfx', name: '音效' },
  ];

  return (
    <div className="p-4 border-b border-border-secondary">
      <div className="flex w-full bg-bg-tertiary p-1 rounded-lg">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => setActiveAudioTask(task.id)}
            className={`
              flex-1 py-1.5 rounded-md text-sm font-medium transition-colors
              ${activeAudioTask === task.id
                ? 'bg-accent-purple text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
              }
            `}
          >
            {t(task.name)}
          </button>
        ))}
      </div>
    </div>
  );
}


export function AudioPanel() {
  const activeAudioTask = useActiveAudioTask();

  const renderTaskContent = () => {
    switch (activeAudioTask) {
      case 'voiceover':
        return <VoiceoverTaskPanel />;
      case 'bgm':
        return (
          <>
            <BgmCategoryTabs />
            <div className="flex-1 overflow-y-auto">
              <AudioLibrary />
            </div>
          </>
        );
      case 'sfx':
        return (
          <>
            <SoundEffectCategoryTabs />
            <div className="flex-1 overflow-y-auto">
              <AudioLibrary />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      <AudioTaskToggle />
      {renderTaskContent()}
    </div>
  );
}