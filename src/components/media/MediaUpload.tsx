import { useRef, useState } from 'react';
import { useMediaStore } from '@/stores/useMediaStore';
import { validateMediaFile, createMediaItem } from '@/utils/mediaUtils';
import { Loader2, CloudUpload } from 'lucide-react'; // <-- 1. 导入图标

export function MediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addUploadedMedia } = useMediaStore();

  const handleFileSelect = async (files: FileList) => {
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = validateMediaFile(file);
        if (validation.isValid) {
          const mediaItem = await createMediaItem(file);
          addUploadedMedia(mediaItem);
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
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

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isUploading}
        className="w-full py-2 px-4 bg-accent-purple hover:bg-accent-purple/80 disabled:bg-accent-purple/50 text-white text-sm rounded transition-colors flex items-center justify-center gap-2"
      >
        {isUploading ? (
          // <-- 2. 替换为 Lucide 加载图标
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            上传中...
          </>
        ) : (
          // <-- 3. 替换为 Lucide 上传图标
          <>
            <CloudUpload className="h-4 w-4" />
            上传
          </>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}