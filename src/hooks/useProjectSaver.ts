import { useState } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';

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
    projectStore.setSaveStatus('saving'); 

    try {
      
      const projectData = projectStore.exportProject();
      projectData.metadata.modifiedAt = new Date().toISOString();
      const jsonString = JSON.stringify(projectData, null, 2);
      
      
      downloadJson(jsonString, `${projectData.metadata.title || 'project'}.json`);
      
      
      projectStore.markSaved(); 
      setIsSaving(false);

    } catch (error) {
      console.error('Save failed:', error);
      projectStore.setSaveStatus('error');
      setIsSaving(false);
      
      
      setTimeout(() => {
        if (projectStore.saveStatus === 'error') {
           projectStore.markUnsaved(); 
        }
      }, 2000);
    }
  };

  return { 
    isSaving, 
    saveProjectToFile: saveProject 
  };
};