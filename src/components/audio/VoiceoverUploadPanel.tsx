import { useState, useRef } from 'react';
import { useVoiceoverStore } from '@/stores/useVoiceoverStore';
import { Loader2, UploadCloud, AlertTriangle } from 'lucide-react';

export function VoiceoverUploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { uploadVoiceover, isGenerating } = useVoiceoverStore();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!file.type.startsWith('audio/')) {
      setUploadError('仅支持音频格式 (MP3, WAV等)');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError('文件大小不能超过 10MB');
      return;
    }

    try {
    
      await uploadVoiceover(file);

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '上传失败');
    } finally {
      // 清空 input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    <div className="p-4">
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
          accept="audio/*"
          onChange={handleFileChange}
          disabled={isGenerating} 
          className="hidden"
        />
        
        {isGenerating ? (
          <>
            <Loader2 size={48} className="animate-spin text-accent-purple mb-3" />
            <div className="text-text-secondary">处理中...</div>
          </>
        ) : (
          <>
            <UploadCloud size={48} className="mb-3 text-text-tertiary" />
            <div className="text-text-primary font-medium mb-1">点击选择或拖拽上传</div>
            <div className="text-sm text-text-secondary">
              支持 MP3, WAV
            </div>
          </>
        )}
        
        {uploadError && (
          <div className="mt-3 text-sm text-red-500 flex items-center gap-1">
            <AlertTriangle size={16} /> 
            {uploadError}
          </div>
        )}
      </div>
    </div>
  );
}