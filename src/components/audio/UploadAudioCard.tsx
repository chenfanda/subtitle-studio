import { useRef, useState } from 'react';
import { useAudioStore } from '@/stores/useAudioStore';
import { validateAudioFile } from '@/utils/audioUtils';

export function UploadAudioCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
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
      disabled={isUploading}
      className={`
        relative w-full h-20 rounded-lg border-2 transition-all duration-200
        hover:scale-105 overflow-hidden bg-bg-secondary
        ${isUploading 
          ? 'border-accent-purple cursor-not-allowed' 
          : 'border-border-secondary hover:border-border-primary cursor-pointer'
        }
      `}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
        {isUploading ? (
          <>
            <div className="text-lg mb-1">⏳</div>
            <div className="text-xs text-text-secondary">上传中...</div>
          </>
        ) : (
          <>
            <div className="text-lg mb-1">📁</div>
            <div className="text-xs text-text-primary font-medium">上传音频</div>
            <div className="text-xs text-text-secondary">添加自定义音频</div>
          </>
        )}
      </div>
      
      {uploadError && (
        <div className="absolute inset-0 bg-red-500/90 flex items-center justify-center p-2">
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