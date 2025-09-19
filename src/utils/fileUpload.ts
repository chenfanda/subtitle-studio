// 文件上传相关的工具函数

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * 验证视频文件
 */
export const validateVideoFile = (file: File): FileValidationResult => {
  // 检查文件类型
  const supportedFormats = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (!supportedFormats.includes(fileExtension)) {
    return {
      isValid: false,
      error: `不支持的文件格式。支持的格式：${supportedFormats.join(', ')}`
    };
  }

  // 检查文件大小（限制为 500MB）
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: '文件过大。最大支持 500MB'
    };
  }

  return { isValid: true };
};

/**
 * 创建视频对象URL
 */
export const createVideoObjectUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * 释放视频对象URL
 */
export const revokeVideoObjectUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * 从拖放事件中提取文件
 */
export const extractFilesFromDrop = (event: DragEvent): File[] => {
  const files: File[] = [];
  
  if (event.dataTransfer?.files) {
    for (let i = 0; i < event.dataTransfer.files.length; i++) {
      const file = event.dataTransfer.files[i];
      if (file) {
        files.push(file);
      }
    }
  }
  
  return files;
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 获取文件扩展名
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};