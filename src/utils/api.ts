import type { ProjectExport } from '@/types/project';
import { API_CLIENT } from '@/config/api-client';


export const api = {
  startExportJob: async (projectData: ProjectExport, signal?: AbortSignal): Promise<{ jobId: string }> => {
    const response = await fetch(`${API_CLIENT.BASE_URL}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
      signal,
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorMessage = response.statusText;
      
      try {
        if (contentType && contentType.includes("application/json")) {
          const errorJson = await response.json();
          errorMessage = errorJson.error || errorMessage;
        } else {
          errorMessage = await response.text();
        }
      } catch(e) {}

      throw new Error(`启动后端导出失败: ${errorMessage}`);
    }
    
    return await response.json();
  },

  getJobStatus: async (jobId: string, signal?: AbortSignal): Promise<{ status: string, url?: string, progress?: number, error?: string,result?: any  }> => {
    const response = await fetch(`${API_CLIENT.BASE_URL}/status/${jobId}`, {
      signal
    });
    
    if (!response.ok) {
      throw new Error(`检查作业状态失败: ${response.statusText}`);
    }
    
    return await response.json();
  },

  cancelExportJob: async (jobId: string): Promise<void> => {
    await fetch(`${API_CLIENT.BASE_URL}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobId }),
    });
  }
};