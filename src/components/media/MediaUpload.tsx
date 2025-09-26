import { useRef, useState } from 'react';
import { useMediaStore } from '@/stores/useMediaStore';
import { validateMediaFile, createMediaItem, formatFileSize } from '@/utils/mediaUtils';

export function MediaUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addUploadedMedia } = useMediaStore();

  const handleFileSelect = async (files: FileList) => {
    setError(null);
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = validateMediaFile(file);
        
        if (!validation.isValid) {
          setError(validation.error || '文件验证失败');
          continue;
        }

        const mediaItem = await createMediaItem(file);
        addUploadedMedia(mediaItem);
      }
    } catch (err) {
      setError('上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${isDragOver 
            ? 'border-accent-purple bg-accent-purple/10' 
            : 'border-border-secondary hover:border-accent-purple hover:bg-accent-purple/5'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <div className="space-y-2">
          <div className="text-2xl">
            {isUploading ? '⏳' : '📁'}
          </div>
          <div className="text-sm text-text-primary">
            {isUploading ? '上传中...' : '点击上传或拖拽文件到此处'}
          </div>
          <div className="text-xs text-text-tertiary">
            支持 JPG, PNG, GIF, WebP 格式，最大 10MB
          </div>
        </div>
      </div>

      {error && (
        <div className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 rounded p-2">
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}