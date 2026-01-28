import request from '@/utils/api';

const uploadBlob = async (
  blobUrl: string,
  _type: string,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<string> => {
  const response = await fetch(blobUrl);
  const blob = await response.blob();

  const formData = new FormData();
  const ext = blob.type.split('/')[1] || 'dat';
  formData.append('file', blob, `file.${ext}`);

  try {
    const res: any = await request.post('/upload', formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(progressEvent.loaded / progressEvent.total);
        }
      },
      signal,
      // Ensure we don't let axios try to parse the content-type, let the browser handle it for FormData
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.url;
  } catch (error: any) {
    if (error.name === 'CanceledError' || error.name === 'AbortError') {
      throw new Error('Aborted');
    }
    throw new Error(`Upload failed: ${error.response?.data?.error || error.message}`);
  }
};

export const fileUploader = {
  uploadBlob,
};