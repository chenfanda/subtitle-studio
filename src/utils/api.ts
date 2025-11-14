import type { ProjectExport } from '@/types/project';

// (修改) 假设您的后端 API 部署在 /api 路径下
const API_BASE_URL = '/api/export';

// (修改) 移除所有模拟代码
const api = {
  startExportJob: async (projectData: ProjectExport): Promise<{ jobId: string }> => {
    console.log('API: 正在发送导出作业到后端...');
    
    const response = await fetch(`${API_BASE_URL}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`启动后端导出失败: ${errorBody}`);
    }
    
    const result = await response.json();
    console.log('API: 已创建作业 ID:', result.jobId);
    return result;
  },

  getJobStatus: async (jobId: string): Promise<{ status: string, url?: string }> => {
    console.log('API: 正在检查作业状态', jobId);
    
    const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
    
    if (!response.ok) {
      throw new Error(`检查作业状态失败: ${response.statusText}`);
    }
    
    const result = await response.json();
    // 假设后端返回:
    // { status: 'processing' }
    // { status: 'completed', url: 'https://...' }
    // { status: 'error', message: '...' }
    return result;
  }
};
export { api };