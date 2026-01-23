import { useState, useRef } from 'react';
import { getBrollDuration, generateBrollThumbnail } from '@/utils/brollUtils';
import type { BrollVideo } from '@/types/broll';
import { Loader2, UploadCloud, AlertTriangle } from 'lucide-react';
import { InsertVideoCard } from './InsertVideoCard';
import { useTranslation } from '@/hooks/useTranslation';

interface InsertVideoLocalViewProps {
  onVideoSelect: (video: BrollVideo) => void;
  selectedVideo: BrollVideo | null;
}

export function InsertVideoLocalView({ onVideoSelect, selectedVideo }: InsertVideoLocalViewProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedVideos, setUploadedVideos] = useState<BrollVideo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/mp4')) {
      setUploadError(t('仅支持 MP4 格式'));
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(t('文件大小不能超过 50MB'));
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const videoUrl = URL.createObjectURL(file);
      const duration = await getBrollDuration(videoUrl);

      if (duration > 300) {
        setUploadError(t('视频时长不能超过 300 秒'));
        URL.revokeObjectURL(videoUrl);
        setIsUploading(false);
        return;
      }

      const thumbnail = await generateBrollThumbnail(videoUrl, 1);

      const newVideo: BrollVideo = {
        id: `local_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url: videoUrl,
        thumbnail,
        duration: Math.floor(duration),
        tags: [t('本地上传')],
      };

      setUploadedVideos(prev => [newVideo, ...prev]);
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setIsUploading(false);
      setUploadError(error instanceof Error ? error.message : t('上传失败'));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      handleFileChange({ target: fileInputRef.current } as any);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div
        onClick={handleUploadClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="
          border-2 border-dashed border-border-secondary rounded-lg
          bg-bg-tertiary hover:border-accent-purple hover:bg-bg-secondary
          transition-all duration-200 cursor-pointer
          flex flex-col items-center justify-center
          py-12
        "
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4"
          onChange={handleFileChange}
          className="hidden"
        />

        {isUploading ? (
          <>
            <Loader2 size={48} className="animate-spin text-accent-purple mb-3" />
            <div className="text-text-secondary">{t('上传中...')}</div>
          </>
        ) : (
          <>
            <UploadCloud size={64} className="mb-3 text-text-tertiary" />
            <div className="text-text-primary font-medium mb-1">{t('点击选择或拖拽上传')}</div>
            <div className="text-sm text-text-secondary">
              {t('支持 MP4（最多 300 秒，50 MB）')}
            </div>
          </>
        )}

        {uploadError && (
          <div className="mt-3 text-sm text-red-500 flex items-center justify-center gap-1">
            <AlertTriangle size={16} />
            {uploadError}
          </div>
        )}
      </div>

      {uploadedVideos.length > 0 && (
        <>
          <div className="text-sm font-medium text-text-primary">
            {t('已上传')} ({uploadedVideos.length})
          </div>
          <div className="grid grid-cols-2 gap-4">
            {uploadedVideos.map((video) => (
              <InsertVideoCard
                key={video.id}
                video={video}
                isSelected={selectedVideo?.id === video.id}
                onClick={() => onVideoSelect(video)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}