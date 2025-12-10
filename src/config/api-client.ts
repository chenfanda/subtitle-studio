// 1. 确定网关地址
// 开发环境(npm run dev): 使用相对路径 '/api'，通过 Vite 代理转发
// 生产环境(npm run build): 读取环境变量，连接云端 HTTPS 网关
const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || '/api';

export const API_CLIENT = {
  // 基础地址
  BASE_URL: GATEWAY_URL,

  // 所有功能端点 (全部发给 Node.js 主后端)
  ENDPOINTS: {
    UPLOAD_FILE: `${GATEWAY_URL}/upload`,            // 纯文件上传
    PROCESS_MEDIA: `${GATEWAY_URL}/process-media`,   // 上传 + ASR处理 (网关转发)
    EXPORT_PROJECT: `${GATEWAY_URL}/export`,         // 导出任务
    CHECK_STATUS: `${GATEWAY_URL}/status`,           // 任务状态
    CANCEL_JOB: `${GATEWAY_URL}/cancel`,             // 取消任务
  }
};