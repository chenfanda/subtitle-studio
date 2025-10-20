import { useRef, useState } from 'react';
import { useAudioStore } from '@/stores/useAudioStore';
import { validateAudioFile } from '@/utils/audioUtils';

export function UploadAudioCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  
  const { uploadAudio } = useAudioStore();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    
    if (!validateAudioFile(file)) {
      setUploadError('音频格式不支持或文件过大');
      return;
    }

    setIsUploading(true);
    
    try {
      await uploadAudio(file);
    } catch (error) {
      setUploadError('上传失败，请重试');
      console.error('Audio upload failed:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={isUploading}
      className={`
        relative w-full rounded-lg transition-all duration-200
        overflow-hidden p-2 flex items-center gap-3
        ${isHovering && !isUploading ? 'border-2 border-accent-purple' : 'border-0'}
        ${isUploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
      `}
    >
      <div className="flex-shrink-0 w-16 h-16 rounded bg-bg-tertiary flex items-center justify-center">
        <div className="text-2xl">
          {isUploading ? '⏳' : '📁'}
        </div>
      </div>
      
      <div className="flex-1 text-left min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">
          {isUploading ? '上传中...' : '上传音频'}
        </div>
        <div className="text-xs text-text-secondary mt-0.5">
          添加自定义音频
        </div>
      </div>
      
      {uploadError && (
        <div className="absolute inset-0 bg-red-500/90 flex items-center justify-center rounded-lg p-2">
          <span className="text-xs text-white text-center">{uploadError}</span>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </button>
  );
}