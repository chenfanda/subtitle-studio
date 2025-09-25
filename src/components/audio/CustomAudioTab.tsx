import { AudioCard } from './AudioCard';
import { UploadAudioCard } from './UploadAudioCard';
import { useAudioStore } from '@/stores/useAudioStore';

export function CustomAudioTab() {
  const uploadedTracks = useAudioStore((state) => state.uploadedTracks);

  return (
    <div className="grid grid-cols-2 gap-3">
      <UploadAudioCard />
      
      {uploadedTracks.map((track) => (
        <AudioCard key={track.id} track={track} />
      ))}
      
      {uploadedTracks.length === 0 && (
        <div className="col-span-2 text-center text-text-secondary py-8">
          还没有上传的音频，点击上方卡片开始上传
        </div>
      )}
    </div>
  );
}