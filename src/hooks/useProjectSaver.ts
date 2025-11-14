// utils/useProjectSaver.ts
// (已修正 - 恢复下载功能)

import { useState } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';

// ✅ 1. (新增) 添加一个辅助函数来触发浏览器下载
const downloadJson = (jsonString: string, fileName: string) => {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const useProjectSaver = () => {
  const [isSaving, setIsSaving] = useState(false);
  
  const saveProject = async () => {
    setIsSaving(true);
    const projectStore = useProjectStore.getState();
    projectStore.setSaveStatus('saving'); // 状态 -> "保存中..."

    try {
      // ✅ 2. (修改) 不再模拟，而是真正获取数据
      const projectData = projectStore.exportProject();
      projectData.metadata.modifiedAt = new Date().toISOString();
      const jsonString = JSON.stringify(projectData, null, 2);
      
      // ✅ 3. (修改) 调用下载功能
      downloadJson(jsonString, `${projectData.metadata.title || 'project'}.json`);
      
      // 4. 更新状态 -> "已保存"
      projectStore.markSaved(); 
      setIsSaving(false);

    } catch (error) {
      console.error('Save failed:', error);
      projectStore.setSaveStatus('error');
      setIsSaving(false);
      
      // (保留) 2秒后自动清除错误状态
      setTimeout(() => {
        if (projectStore.saveStatus === 'error') {
           projectStore.markUnsaved(); 
        }
      }, 2000);
    }
  };

  return { 
    isSaving, 
    saveProjectToFile: saveProject // 导出的函数已更新
  };
};