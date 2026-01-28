import { v4 as uuidv4 } from 'uuid';
import { parseSRT } from '@/utils/subtitleParser';
import type { SubtitleItem } from '@/types/subtitle';
import { API_CLIENT } from '@/config/api-client';
import { getAuthToken } from '@/utils/authUtils';

interface SourceResources {
  video: string;
  audioVocals: string;
  audioBacking: string;
  originalSubtitleUrl?: string;
}

// 后端返回的 JSON 结构 (ASR_Diarization 脚本返回的格式)
interface BackendResponse {
  success: boolean;
  data: {
    subtitles: {
      format: string;
      content: string; // SRT 纯文本
      url: string;
    };
    source_resources: {
      video: string;
      audioVocals?: string;
      audioBacking?: string;
    };
    metadata?: {
      segments_count: number;
    };
  };
}

export interface TranscribeOptions {
  file: File;
  language?: string;
  onProgress?: (progress: number) => void;
  enableVocalSeparation?: boolean;
  enableDiarization?: boolean;
}

/**
 * 上传视频并初始化项目
 */
export const uploadAndInitializeProject = async ({
  file,
  language: _language = 'zh',
  onProgress,
  enableVocalSeparation = true,
  enableDiarization = true
}: TranscribeOptions): Promise<{
  subtitles: SubtitleItem[],
  sourceResources: SourceResources
}> => {

  // Pre-flight: Validate token before starting heavy upload to prevent EPIPE errors
  const token = getAuthToken();
  if (!token) {
    window.dispatchEvent(new CustomEvent('auth:logout'));
    return Promise.reject(new Error('未登录或凭证已过期'));
  }

  // Double-check token validity with a lightweight request
  try {
    const response = await fetch(`${API_CLIENT.BASE_URL}/user/profile`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status === 401 || response.status === 403) {
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(new Error('凭证已失效，正在退出...'));
    }
  } catch (e) {
    // Network error on pre-check, might be server down, but safe to fail early
    console.warn('Auth pre-check failed', e);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();


    formData.append('file', file);
    formData.append('user_id', 'user_default');
    formData.append('project_id', `proj_${Date.now()}`);
    formData.append('enable_diarization', enableDiarization ? 'true' : 'false');
    formData.append('enable_vocal_separation', enableVocalSeparation ? 'true' : 'false');

    const endpoint = API_CLIENT.ENDPOINTS.PROCESS_MEDIA;



    xhr.open('POST', endpoint, true);

    const token = getAuthToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 80);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {

      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);

        try {
          const response: BackendResponse = JSON.parse(xhr.responseText);

          if (!response.success && !response.data) {
            throw new Error('后端返回业务逻辑错误 (success: false)');
          }

          // 4. 解析 SRT 内容
          const srtContent = response.data.subtitles.content;
          const msSubtitles = parseSRT(srtContent);


          const formattedSubtitles: SubtitleItem[] = msSubtitles.map(item => ({
            ...item,
            id: item.id || uuidv4(),
            startTime: item.startTime / 1000,
            endTime: item.endTime / 1000,
          }));



          const baseUrl = typeof window !== 'undefined' ? window.location.origin : API_CLIENT.BASE_URL.replace(/\/$/, '');
          const resolveUrl = (path: string | undefined) => {
            if (!path) return '';
            if (path.startsWith('http')) return path;
            let cleanPath = path.startsWith('/') ? path : `/${path}`;
            if (cleanPath.startsWith('/static') && !cleanPath.startsWith('/api')) {
              cleanPath = `/api${cleanPath}`;
            }
            return `${baseUrl}${cleanPath}`;
          };

          const rawResources = response.data.source_resources;
          const sourceResources: SourceResources = {
            video: resolveUrl(rawResources.video),
            audioVocals: resolveUrl(rawResources.audioVocals),
            audioBacking: resolveUrl(rawResources.audioBacking),
            originalSubtitleUrl: resolveUrl(response.data.subtitles.url)
          };

          resolve({
            subtitles: formattedSubtitles,
            sourceResources
          });

        } catch (error) {
          console.error('解析失败:', error);
          reject(new Error('无法解析服务器数据，请查看控制台日志'));
        }
      } else {
        // Handle Auth Failures (401/403) explicitly since this XHR bypasses axios interceptors
        if (xhr.status === 401 || xhr.status === 403) {
          window.dispatchEvent(new CustomEvent('auth:logout'));
          reject(new Error('登录已过期，请重新登录'));
          return;
        }

        // 捕获 404, 500 等 HTTP 错误
        reject(new Error(`请求失败: ${xhr.status} ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('网络错误，请检查后端服务(8008)是否开启'));
    };

    xhr.send(formData);
  });
};