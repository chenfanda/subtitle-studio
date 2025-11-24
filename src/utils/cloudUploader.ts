const API_UPLOAD_URL = 'http://localhost:8000/api/upload';

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

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (signal) {
      if (signal.aborted) {
        return reject(new Error('Aborted'));
      }
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Aborted'));
      });
    }

    xhr.open('POST', API_UPLOAD_URL);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded / event.total);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.url);
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));

    xhr.send(formData);
  });
};

export const fileUploader = {
  uploadBlob,
};