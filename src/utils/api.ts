import axios from 'axios';
import { API_CLIENT } from '@/config/api-client';
import type { ProjectExport } from '@/types/project';

// Create AXIOS instance
const request = axios.create({
  baseURL: API_CLIENT.BASE_URL,
  timeout: 60000,
});

// Request Interceptor: Attach JWT Token
request.interceptors.request.use(
  (config) => {
    const userStorage = localStorage.getItem('user-storage');
    if (userStorage) {
      const { state } = JSON.parse(userStorage);
      if (state.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expired (401)
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

request.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return request(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const userStorage = localStorage.getItem('user-storage');
        const { state } = JSON.parse(userStorage || '{}');

        const res = await axios.post(`${API_CLIENT.BASE_URL}/auth/refresh`, {
          refreshToken: state.refreshToken
        });

        const { accessToken } = res.data;

        // Update storage
        localStorage.setItem('user-storage', JSON.stringify({
          ...JSON.parse(userStorage!),
          state: { ...state, accessToken }
        }));

        processQueue(null, accessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return request(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        // Trigger global logout
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const api = {
  startExportJob: (projectData: ProjectExport, signal?: AbortSignal) =>
    request.post('/export', projectData, { signal }),

  getJobStatus: (jobId: string, signal?: AbortSignal) =>
    request.get(`/status/${jobId}`, { signal }),

  cancelExportJob: (jobId: string) =>
    request.post('/cancel', { jobId }),

  // Auth endpoints
  sendOTP: (type: 'phone' | 'email', account: string) =>
    request.post('/auth/send-otp', { type, account }),

  loginOTP: (type: 'phone' | 'email', account: string, code: string) =>
    request.post('/auth/login-otp', { type, account, code }),

  logout: (refreshToken: string) =>
    request.post('/auth/logout', { refreshToken }),

  getWeChatQR: () => request.get('/auth/wechat-qrcode'),

  checkWeChatStatus: (uuid: string) => request.get(`/auth/wechat-status/${uuid}`),

  // User & VIP endpoints
  getProfile: () => request.get('user/profile'),
  subscribe: (planId: string) => request.post('user/subscribe', { planId }),
};

export default request;