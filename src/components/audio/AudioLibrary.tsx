import { useActiveCategory } from '@/stores/useAudioStore';
import { LikeAudioTab } from './LikeAudioTab';
import { EpicAudioTab } from './EpicAudioTab';
import { AmbientAudioTab } from './AmbientAudioTab';
import { AcousticAudioTab } from './AcousticAudioTab';
import { ElectronicAudioTab } from './ElectronicAudioTab';
import { CustomAudioTab } from './CustomAudioTab';

export function AudioLibrary() {
  const activeCategory = useActiveCategory();

  return (
    <div className="p-4">
      {activeCategory === 'like' && <LikeAudioTab />}
      {activeCategory === 'epic' && <EpicAudioTab />}
      {activeCategory === 'ambient' && <AmbientAudioTab />}
      {activeCategory === 'acoustic' && <AcousticAudioTab />}
      {activeCategory === 'electronic' && <ElectronicAudioTab />}
      {activeCategory === 'custom' && <CustomAudioTab />}
    </div>
  );
}