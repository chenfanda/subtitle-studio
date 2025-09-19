import { useState, useRef } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { 
  validateVideoFile, 
  createVideoObjectUrl, 
  extractFilesFromDrop 
} from '@/utils/fileUpload';

export function UploadStage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setVideoUrl } = useProjectStore();

  const handleFileUpload = (file: File) => {
    const validation = validateVideoFile(file);
    if (!validation.isValid) {
      setUploadError(validation.error || '文件验证失败');
      return;
    }

    setUploadError(null);
    const url = createVideoObjectUrl(file);
    setVideoUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = extractFilesFromDrop(e.nativeEvent);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div
          className={`
            border-2 border-dashed rounded-xl p-16 text-center transition-colors
            ${isDragging 
              ? 'border-accent-purple bg-accent-purple/10' 
              : 'border-border-primary hover:border-accent-purple/50'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-6">
            <div className="text-6xl">
              {isDragging ? '⬇️' : '📁'}
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                {isDragging ? '松开上传视频' : '上传视频文件'}
              </h2>
              <p className="text-text-secondary">
                拖拽文件到此处或点击选择文件
              </p>
            </div>

            <button
              onClick={handleButtonClick}
              className="px-6 py-3 bg-accent-purple hover:bg-purple-600 text-white font-medium rounded-lg transition-colors"
            >
              选择文件
            </button>

            {uploadError && (
              <div className="p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg">
                <p className="text-accent-red text-sm">{uploadError}</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}