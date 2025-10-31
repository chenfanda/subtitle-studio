import { 
  useTracksForActiveTask, 
  useActiveAudioTask, 
  useActiveCategory, 
  useActiveSfxCategory 
} from '@/stores/useAudioStore';
import { AudioCard } from './AudioCard';
import { UploadAudioCard } from './UploadAudioCard';

export function AudioLibrary() {
  const tracks = useTracksForActiveTask();

  const activeAudioTask = useActiveAudioTask();
  const activeCategory = useActiveCategory();
  const activeSfxCategory = useActiveSfxCategory();

  const isBgmCustom = activeAudioTask === 'bgm' && activeCategory === 'custom';
  const isSfxCustom = activeAudioTask === 'sfx' && activeSfxCategory === 'customSfx';
  const showUploadCard = isBgmCustom || isSfxCustom;

  return (
    <div className="p-4 space-y-3 overflow-y-auto">

      {showUploadCard && <UploadAudioCard />} 

      {tracks.map((track) => (
        <AudioCard key={track.id} track={track} />
      ))}

      {showUploadCard && tracks.length === 0 && (
        <div className="text-center text-text-secondary py-8">
          还没有上传的音频，点击上方卡片开始上传
        </div>
      )}

      {!showUploadCard && tracks.length === 0 && (
        <div className="flex items-center justify-center h-40 text-text-tertiary">
          <div className="text-center">
            <div className="text-3xl mb-2">🎧</div>
            <div className="text-sm">此分类下暂无音频</div>
          </div>
        </div>
      )}
    </div>
  );
}