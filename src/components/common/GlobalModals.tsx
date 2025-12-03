import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useUIStore } from '@/stores/useUIStore';
import { useExportStore } from '@/stores/useExportStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useIsPremium } from '@/stores/useUserStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { runFrontendExport } from '@/utils/frontendExporter';
import { runBackendExport } from '@/utils/backendExporter';
import { downloadBlob } from '@/utils/fileUtils';
import { checkFrontendCompatibility, sanitizeProjectForFrontend } from '@/utils/exportCapabilityUtils';
import { api } from '@/utils/api';
import { 
  Zap, 
  Cloud, 
  Crown, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  Lock,
  Square
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

function GlobalModals() {
  return (
    <>
      <ExportModal />
      <SettingsModal />
    </>
  );
}

function ExportModal() {
  const {
    showExportModal,
    setShowExportModal,
    exportSettings,
    updateExportSettings,
    exportStatus,
    setExportStatus,
    setExportError,
    exportProgress,
    setExportProgress,
    exportError,
    setJobId,
    monitorJob,
    jobId: backendJobId, 
    downloadUrl,
    statusMessage,
    setStatusMessage,
    initExport,
    cancelExport,
    startTime
  } = useExportStore();
  
  const isPremium = useIsPremium();
  const getProjectData = useProjectStore(state => state.exportProject);
  
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [localWarning, setLocalWarning] = useState<{ show: boolean; issues: string[] }>({ 
    show: false, 
    issues: [] 
  });
  const [elapsedTime, setElapsedTime] = useState('00:00');

  const isExporting = ['preparing', 'uploading', 'processing_frontend', 'processing_backend', 'polling'].includes(exportStatus);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExporting && startTime) {
      setElapsedTime('00:00');
      const start = startTime;
      interval = setInterval(() => {
        const seconds = Math.floor((Date.now() - start) / 1000);
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        setElapsedTime(`${m}:${s}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExporting, startTime]);

  const handleClose = () => {
    if (isExporting) return;
    setShowExportModal(false);
    setExportStatus('idle');
    setResultBlob(null);
    setJobId(''); 
    setExportError(null);
    setLocalWarning({ show: false, issues: [] });
    setElapsedTime('00:00');
  };

  const handleCancelTask = () => {
    cancelExport();
    if (backendJobId) {
      api.cancelExportJob(backendJobId).catch(err => {
        console.warn(err);
      });
    }
  };

  const executeLocalExport = async (projectData: any) => {
    setLocalWarning({ show: false, issues: [] });
    
    const needsPremiumRes = exportSettings.resolution > 720 || exportSettings.format === 'gif';
    if (needsPremiumRes && !isPremium) {
      setExportError('导出 1080p 或 GIF 格式是 Pro 会员功能。');
      return;
    }

    const controller = initExport();

    try {
      setResultBlob(null);
      const blob = await runFrontendExport(
        projectData,
        exportSettings,
        isPremium,
        (progress, msg) => {
          setExportProgress(progress);
          setStatusMessage(msg);
        },
        controller.signal
      );
      setResultBlob(blob);
      setExportStatus('success');
    } catch (error: any) {
      if (error.message === 'Aborted') return;
      const errorMsg = error instanceof Error ? error.message : '导出过程中发生未知错误';
      setExportError(errorMsg);
    }
  };

  const handleLocalExportClick = () => {
    const project = getProjectData();
    const { isCompatible, issues } = checkFrontendCompatibility(project);

    if (!isCompatible) {
      setLocalWarning({ show: true, issues });
    } else {
      executeLocalExport(project);
    }
  };

  const handleContinueWithDowngrade = () => {
    const originalProject = getProjectData();
    const sanitizedProject = sanitizeProjectForFrontend(originalProject);
    executeLocalExport(sanitizedProject);
  };

const handleCloudExportClick = async () => {
    if (isExporting) return;
    if (!isPremium) {
      setExportError('云端高清渲染是 Pro 会员专属功能。');
      return;
    }

    const controller = initExport();
    
    setExportStatus('preparing');
    setExportProgress(0);
    setStatusMessage('正在分析工程...');
    setExportError(null);
    setJobId('');
    
    requestAnimationFrame(() => {
      setTimeout(async () => {
        try {
          const project = getProjectData();
          
          setStatusMessage('正在打包上传...');
          setExportStatus('uploading');
          
          const res = await runBackendExport(
            project,
            exportSettings,
            (progress, msg) => {
              setExportProgress(progress);
              setStatusMessage(msg);
            },
            controller.signal
          );
          
          const newJobId = typeof res === 'object' && res !== null && 'jobId' in res ? (res as any).jobId : res;
          if (!newJobId) throw new Error('未能获取任务ID');

          setJobId(newJobId);
          monitorJob();

        } catch (error: any) {
          if (error.message === 'Aborted') return;
          setExportStatus('idle');
          setExportError(error instanceof Error ? error.message : '云端服务连接失败');
        }
      }, 50);
    });
  };
  
  const handleSaveFile = () => {
    if (resultBlob) {
      const ext = exportSettings.format === 'gif' ? 'gif' : 'mp4';
      downloadBlob(resultBlob, `export.${ext}`);
      handleClose();
    } else if (backendJobId) {
      const finalUrl = downloadUrl || `${API_BASE_URL}/downloads/${backendJobId}.mp4`;
      const a = document.createElement('a');
      a.href = finalUrl;
      a.download = `video-${backendJobId.slice(0, 8)}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      handleClose();
    }
  };

  const getExportingText = () => {
    if (statusMessage) return statusMessage;
    switch (exportStatus) {
      case 'preparing': return '正在分析工程...';
      case 'uploading': return `正在上传资源...`;
      case 'processing_frontend': return `浏览器正在合成...`;
      case 'processing_backend': 
      case 'polling': 
        return `云端渲染中...`; 
      default: return '处理中...';
    }
  };

  return (
    <Modal
      isOpen={showExportModal}
      onClose={handleClose}
      title="导出视频"
      className="max-w-2xl"
    >
      <div className="p-6">
        {!isExporting && exportStatus !== 'success' && !localWarning.show && (
          <div className="space-y-5 mb-6 border-b border-border-primary pb-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">分辨率</label>
                <div className="flex space-x-2">
                  <button
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center ${
                      exportSettings.resolution === 720
                        ? 'bg-accent-purple text-white'
                        : 'bg-bg-tertiary hover:bg-border-primary text-text-secondary'
                    }`}
                    onClick={() => updateExportSettings({ resolution: 720 })}
                  >
                    720p
                  </button>
                  <button
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center ${
                      exportSettings.resolution === 1080
                        ? 'bg-accent-purple text-white'
                        : 'bg-bg-tertiary hover:bg-border-primary text-text-secondary'
                    } ${!isPremium ? 'opacity-60' : ''}`}
                    onClick={() => updateExportSettings({ resolution: 1080 })}
                  >
                    1080p {!isPremium && <Lock className="w-3 h-3 ml-1.5 opacity-70" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">格式</label>
                <div className="flex space-x-2">
                  <button
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center ${
                      exportSettings.format === 'mp4'
                        ? 'bg-accent-purple text-white'
                        : 'bg-bg-tertiary hover:bg-border-primary text-text-secondary'
                    }`}
                    onClick={() => updateExportSettings({ format: 'mp4' })}
                  >
                    MP4
                  </button>
                  <button
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center ${
                      exportSettings.format === 'gif'
                        ? 'bg-accent-purple text-white'
                        : 'bg-bg-tertiary hover:bg-border-primary text-text-secondary'
                    } ${!isPremium ? 'opacity-60' : ''}`}
                    onClick={() => updateExportSettings({ format: 'gif' })}
                  >
                    GIF {!isPremium && <Lock className="w-3 h-3 ml-1.5 opacity-70" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {exportError && (
          <div className="mb-6 p-3 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
            {exportError}
          </div>
        )}

        <div>
          {isExporting ? (
            <div className="py-8 text-center relative flex flex-col items-center justify-center">
              
              <p className="text-text-primary font-medium mb-2 text-lg animate-pulse">
                {getExportingText()}
              </p>
              
              <div className="text-3xl font-bold text-accent-purple mb-5 font-mono tracking-wider">
                {elapsedTime}
              </div>

              <div className="w-64 mx-auto bg-bg-tertiary rounded-full h-1.5 mb-8 overflow-hidden relative">
                <div 
                  className="bg-accent-purple h-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(exportProgress, 1) * 100}%` }}
                />
                <div className="absolute inset-0 bg-white/10 animate-[shimmer_2s_infinite] w-full h-full"/>
              </div>

              <button 
                onClick={handleCancelTask}
                className="px-8 py-2.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm font-medium flex items-center space-x-2"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>停止任务</span>
              </button>

              <p className="text-text-disabled text-xs mt-4 opacity-70">
                {['processing_backend', 'polling'].includes(exportStatus) 
                  ? '服务器正在进行云端渲染...' 
                  : '请保持网络连接'}
              </p>
            </div>

          ) : exportStatus === 'success' ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">导出完成！</h3>
              <p className="text-text-secondary text-sm mb-6">您的视频已准备就绪。</p>
              <button
                className="w-full max-w-xs mx-auto px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors flex items-center justify-center"
                onClick={handleSaveFile}
              >
                下载文件
              </button>
            </div>

          ) : localWarning.show ? (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-5">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-yellow-500/10 rounded-lg shrink-0">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-text-primary mb-2">检测到高级特效</h4>
                  <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                    您选择了本地导出，但项目中包含以下 <span className="text-yellow-500 font-medium">FFmpeg 不支持</span> 的功能：
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {localWarning.issues.map(issue => (
                      <span key={issue} className="px-2 py-1 bg-bg-tertiary border border-border-primary rounded text-xs text-text-secondary">
                        {issue}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-text-secondary mb-4">
                    如果继续，这些特效将被<b className="text-text-primary">自动移除</b>。如需保留完美效果，请使用云端导出。
                  </p>
                  
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setLocalWarning({ show: false, issues: [] })}
                      className="px-4 py-2 bg-bg-tertiary hover:bg-border-primary text-text-primary text-sm rounded font-medium transition-colors"
                    >
                      返回
                    </button>
                    <button 
                      onClick={handleContinueWithDowngrade}
                      className="flex-1 px-4 py-2 bg-yellow-600/90 hover:bg-yellow-600 text-white text-sm rounded font-medium transition-colors flex items-center justify-center"
                    >
                      移除特效并继续 <ArrowRight className="w-4 h-4 ml-1.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                disabled={isExporting}
                className={`relative flex flex-col items-start p-5 border-2 border-border-primary bg-bg-tertiary/30 hover:border-accent-purple/50 hover:bg-bg-tertiary rounded-xl transition-all group text-left ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleLocalExportClick}
              >
                <div className="mb-3 p-2 bg-bg-tertiary rounded-lg group-hover:text-accent-purple transition-colors">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-text-primary mb-1 group-hover:text-accent-purple transition-colors">
                  本地极速导出
                </h4>
                <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                  使用浏览器算力，速度快，无需上传。
                  <br/>适合快速预览和简单剪辑。
                </p>
                <div className="mt-auto pt-3 w-full border-t border-border-primary/50">
                  <span className="text-xs text-text-disabled flex items-center">
                    不支持高级光晕/复杂动画
                  </span>
                </div>
              </button>

              <button
                disabled={isExporting}
                className={`relative flex flex-col items-start p-5 border-2 rounded-xl transition-all text-left group ${
                  !isPremium 
                    ? 'border-border-primary bg-bg-tertiary/10 opacity-80 hover:opacity-100' 
                    : 'border-accent-purple/30 bg-accent-purple/5 hover:border-accent-purple hover:bg-accent-purple/10'
                } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleCloudExportClick}
              >
                <div className="absolute top-3 right-3">
                  {!isPremium ? (
                    <span className="bg-bg-tertiary text-text-secondary text-xs px-2 py-1 rounded-full border border-border-primary">
                      Pro
                    </span>
                  ) : (
                    <span className="bg-accent-purple text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Crown className="w-3 h-3 mr-1 fill-current" /> Pro
                    </span>
                  )}
                </div>

                <div className="mb-3 p-2 bg-bg-tertiary rounded-lg group-hover:text-accent-purple transition-colors">
                  <Cloud className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-text-primary mb-1 group-hover:text-accent-purple transition-colors">
                  云端完美渲染
                </h4>
                <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                  服务器后台渲染，完美复刻所有特效。
                  <br/>支持 4K 画质和复杂动画。
                </p>
                <div className="mt-auto pt-3 w-full border-t border-border-primary/50">
                  <span className="text-xs text-accent-green flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> 100% 还原编辑器效果
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function SettingsModal() {
  const { showSettingsModal, setShowSettingsModal } = useUIStore();
  const isPremium = useIsPremium();
  const { watermark, updateWatermark } = useSettingsStore();

  const handleWatermarkToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabledState = e.target.checked;
    if (newEnabledState === false && !isPremium) return;
    updateWatermark({ enabled: newEnabledState });
  };

  return (
    <Modal
      isOpen={showSettingsModal}
      onClose={() => setShowSettingsModal(false)}
      title="设置"
      className="max-w-lg"
    >
      <div className="p-6">
        <div className="space-y-4">
          <h3 className="text-md font-medium text-text-primary border-b border-border-primary pb-2">
            水印
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <label
                htmlFor="watermark-toggle"
                className="font-medium text-text-primary"
              >
                启用项目水印
              </label>
              <p className="text-sm text-text-secondary">
                {!isPremium ? 'Pro 会员可移除水印' : '在视频上显示您的水印'}
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="watermark-toggle"
                className="sr-only peer"
                checked={watermark.enabled}
                onChange={handleWatermarkToggle}
                disabled={!isPremium && watermark.enabled}
              />
              <div
                className={`
                w-11 h-6 bg-bg-tertiary rounded-full 
                peer peer-checked:after:translate-x-full peer-checked:after:border-white 
                after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                after:bg-white after:border-gray-300 after:border after:rounded-full 
                after:h-5 after:w-5 after:transition-all 
                ${
                  !isPremium && watermark.enabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'peer-checked:bg-accent-purple'
                }
              `}
              ></div>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default GlobalModals;