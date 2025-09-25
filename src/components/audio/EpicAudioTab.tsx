import { AudioCard } from './AudioCard';
import { AUDIO_LIBRARY } from '@/constants/mediaCategories';

export function EpicAudioTab() {
  const tracks = AUDIO_LIBRARY.epic;

  return (
    <div className="grid grid-cols-2 gap-3">
      {tracks.map((track) => (
        <AudioCard key={track.id} track={track} />
      ))}
      
      {tracks.length === 0 && (
        <div className="col-span-2 text-center text-text-secondary py-8">
          暂无Epic分类音频
        </div>
      )}
    </div>
  );
}