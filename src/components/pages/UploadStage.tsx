import { useState, useRef } from 'react';
import { UploadCloud, Download, FileVideo, AlertCircle } from 'lucide-react'; 
import { useProjectStore } from '@/stores/useProjectStore';
import { 
  validateVideoFile, 
  extractFilesFromDrop 
} from '@/utils/fileUpload';

export function UploadStage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { setPendingUploadFile, setAppStage } = useProjectStore();

  const handleFileUpload = (file: File) => {
    const validation = validateVideoFile(file);
    if (!validation.isValid) {
      setUploadError(validation.error || '文件验证失败');
      return;
    }

    setUploadError(null);
    setPendingUploadFile(file);
    setAppStage('processing');
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

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div
          className={`
            group relative
            border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 ease-out
            flex flex-col items-center justify-center gap-6
            ${isDragging 
              ? 'border-accent-purple bg-accent-purple/5 scale-[1.02]' 
              : 'border-border-secondary hover:border-accent-purple/50 hover:bg-bg-secondary/30'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* 图标区域 */}
          <div className={`
            p-5 rounded-full transition-colors duration-300
            ${isDragging ? 'bg-accent-purple/20 text-accent-purple' : 'bg-bg-tertiary text-text-secondary group-hover:text-accent-purple group-hover:bg-accent-purple/10'}
          `}>
             {isDragging ? (
               <Download size={48} strokeWidth={1.5} />
             ) : (
               <UploadCloud size={48} strokeWidth={1.5} />
             )}
          </div>
            
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-text-primary tracking-tight">
              {isDragging ? '松开以上传视频' : '上传视频文件'}
            </h2>
            <p className="text-text-secondary text-sm max-w-sm mx-auto leading-relaxed">
              支持 MP4, MOV, MKV <br/>
              <span className="text-text-tertiary text-xs mt-1 block">
                (系统将自动提取人声与字幕)
              </span>
            </p>
          </div>

          <button
            onClick={handleButtonClick}
            className="mt-2 px-8 py-3 bg-accent-purple hover:bg-accent-purple-hover text-white font-medium rounded-xl transition-all shadow-lg shadow-accent-purple/20 active:scale-95 flex items-center gap-2"
          >
            <FileVideo size={18} />
            选择本地文件
          </button>

          {/* 错误提示 */}
          {uploadError && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2">
              <AlertCircle size={16} className="text-accent-red shrink-0" />
              <p className="text-accent-red text-sm font-medium">{uploadError}</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}