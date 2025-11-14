/**
 * 模拟将 Blob 上传到云存储
 * @param blob 
 * @param type 
 * @returns {string} 返回一个模拟的 HTTPS URL
 */
const uploadBlob = async (blobUrl: string, type: 'video' | 'audio' | 'media'): Promise<string> => {
  console.log(`UPLOADER: 开始上传 ${type} (Blob: ${blobUrl.substring(0, 30)}...)`);
  // 模拟 fetch blob
  // const blob = await fetch(blobUrl).then(r => r.blob());
  // const sizeInMB = blob.size / 1024 / 1024;
  await new Promise(resolve => setTimeout(resolve, 500)); // 模拟上传时间
  const mockUrl = `https://mock-storage.com/${type}/${Date.now()}.mp4`;
  console.log('UPLOADER: 上传完成', mockUrl);
  return mockUrl;
};

export const fileUploader = {
  uploadBlob,
};