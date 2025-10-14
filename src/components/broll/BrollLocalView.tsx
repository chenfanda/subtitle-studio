import { useState, useRef } from 'react';
import { BrollCard } from './BrollCard';
import { getBrollDuration, generateBrollThumbnail } from '@/utils/brollUtils';
import type { BrollVideo } from '@/types/broll';

export function BrollLocalView() {
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

    // 验证文件类型
    if (!file.type.startsWith('video/mp4')) {
      setUploadError('仅支持 MP4 格式');
      return;
    }

    // 验证文件大小（50MB）
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('文件大小不能超过 50MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const videoUrl = URL.createObjectURL(file);
      
      // 获取视频时长
      const duration = await getBrollDuration(videoUrl);
      
      // 验证时长（最多60秒）
      if (duration > 60) {
        setUploadError('视频时长不能超过 60 秒');
        URL.revokeObjectURL(videoUrl);
        setIsUploading(false);
        return;
      }

      // 生成缩略图
      const thumbnail = await generateBrollThumbnail(videoUrl, 1);

      // 创建 BrollVideo 对象
      const newVideo: BrollVideo = {
        id: `local_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url: videoUrl,
        thumbnail, // ✅ 修复：使用生成的缩略图
        duration: Math.floor(duration),
        tags: ['本地上传'],
      };

      setUploadedVideos(prev => [...prev, newVideo]);
      setIsUploading(false);
      
      // 清空input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setIsUploading(false);
      setUploadError(error instanceof Error ? error.message : '上传失败');
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
      {/* 上传区域 */}
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple mb-3"></div>
            <div className="text-text-secondary">上传中...</div>
          </>
        ) : (
          <>
            <div className="text-5xl mb-3 text-text-tertiary">☁️</div>
            <div className="text-text-primary font-medium mb-1">点击选择或拖拽上传</div>
            <div className="text-sm text-text-secondary">
              支持 MP4（最多 60 秒，50 MB）
            </div>
          </>
        )}
        
        {uploadError && (
          <div className="mt-3 text-sm text-red-500">
            ⚠️ {uploadError}
          </div>
        )}
      </div>

      {/* 已上传视频列表 */}
      {uploadedVideos.length > 0 && (
        <>
          <div className="text-sm font-medium text-text-primary">
            已上传 ({uploadedVideos.length})
          </div>
          <div className="grid grid-cols-2 gap-4">
            {uploadedVideos.map((video) => (
              <BrollCard key={video.id} video={video} />
            ))}
          </div>
        </>
      )}

      {/* 空状态 */}
      {uploadedVideos.length === 0 && !isUploading && (
        <div className="text-center text-text-tertiary text-sm py-8">
          暂无已上传的视频
        </div>
      )}
    </div>
  );
}