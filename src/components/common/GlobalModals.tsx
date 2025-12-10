import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { useUIStore } from '@/stores/useUIStore';
import { useExportStore } from '@/stores/useExportStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useIsPremium } from '@/stores/useUserStore';
import { UserProfileModal } from '../auth/UserProfileModal';
import { useProjectStore } from '@/stores/useProjectStore';
import { runFrontendExport } from '@/utils/frontendExporter';
import { runBackendExport } from '@/utils/backendExporter';
import { downloadBlob } from '@/utils/fileUtils';
import { checkFrontendCompatibility, sanitizeProjectForFrontend } from '@/utils/exportCapabilityUtils';
import { AuthModal } from '../auth/AuthModal';
import { api } from '@/utils/api';
import { API_CLIENT } from '@/config/api-client'
import { 
  Zap, Cloud, Crown, AlertTriangle, CheckCircle2, ArrowRight,
  Loader2, Lock, Square, Maximize2, X
} from 'lucide-react';


// ==========================================
// 主入口组件
// ==========================================
export default function GlobalModals() {
  return (
    <>
      <ExportModal />
      <SettingsModal />
      <ExportToast />
      <AuthModal />
      <UserProfileModal />
    </>
  );
}

// ==========================================
// 1. 导出弹窗主逻辑组件 (Controller)
// ==========================================
function ExportModal() {
  const store = useExportStore();
  const isPremium = useIsPremium();
  const getProjectData = useProjectStore(state => state.exportProject);
  
  // 本地 UI 状态
  const [localWarning, setLocalWarning] = useState<{ show: boolean; issues: string[] }>({ show: false, issues: [] });
  
  const isExporting = ['preparing', 'uploading', 'processing_frontend', 'processing_backend', 'polling'].includes(store.exportStatus);
  const isSuccess = store.exportStatus === 'success';

  // --- 核心逻辑：关闭处理 ---
  const handleClose = () => {
    if (store.exportStatus === 'success') {
      store.resetExport();
    }
    store.setShowExportModal(false);
  };

  // --- 核心逻辑：取消/重置 ---
  const handleResetAndClose = () => {
    store.setShowExportModal(false);
    store.resetExport(); 
  };

  const handleCancelTask = () => {
    store.cancelExport();
    if (store.jobId) {
      api.cancelExportJob(store.jobId).catch(console.warn);
    }
    store.resetExport();
  };

  // --- 业务逻辑：本地导出 ---
  const executeLocalExport = async (projectData: any) => {
    setLocalWarning({ show: false, issues: [] });
    // 权限检查...
    const needsPremiumRes = store.exportSettings.resolution > 720 || store.exportSettings.format === 'gif';
    if (needsPremiumRes && !isPremium) {
      store.setExportError('导出 1080p 或 GIF 格式是 Pro 会员功能。');
      return;
    }

    const controller = store.initExport();
    try {
      store.setResultBlob(null);
      const blob = await runFrontendExport(
        projectData,
        store.exportSettings,
        isPremium,
        (progress, msg) => {
          store.setExportProgress(progress);
          store.setStatusMessage(msg);
        },
        controller.signal
      );
      store.setResultBlob(blob);
      store.setExportStatus('success');
    } catch (error: any) {
      if (error.message === 'Aborted') return;
      store.setExportError(error instanceof Error ? error.message : '导出错误');
    }
  };

  const onLocalExportClick = () => {
    const project = getProjectData();
    const { isCompatible, issues } = checkFrontendCompatibility(project);
    if (!isCompatible) {
      setLocalWarning({ show: true, issues });
    } else {
      executeLocalExport(project);
    }
  };

  // --- 业务逻辑：云端导出 ---
  const onCloudExportClick = async () => {
    if (isExporting) return;
    if (!isPremium) {
      store.setExportError('云端高清渲染是 Pro 会员专属功能。');
      return;
    }

    const controller = store.initExport();
    store.setExportStatus('preparing');
    store.setExportProgress(0);
    store.setStatusMessage('正在分析工程...');
    store.setExportError(null);
    store.setJobId('');
    
    // 使用 setTimeout 让 UI 先响应状态变化
    requestAnimationFrame(() => {
      setTimeout(async () => {
        try {
          const project = getProjectData();
          store.setStatusMessage('正在打包上传...');
          store.setExportStatus('uploading');
          
          const res = await runBackendExport(
            project,
            store.exportSettings,
            (progress, msg) => {
              store.setExportProgress(progress);
              store.setStatusMessage(msg);
            },
            controller.signal
          );
          
          const newJobId = typeof res === 'object' && res !== null && 'jobId' in res ? (res as any).jobId : res;
          if (!newJobId) throw new Error('未能获取任务ID');

          store.setJobId(newJobId);
          store.monitorJob();
        } catch (error: any) {
          if (error.message === 'Aborted') return;
          store.setExportStatus('idle');
          store.setExportError(error instanceof Error ? error.message : '云端服务连接失败');
        }
      }, 50);
    });
  };

  // --- 业务逻辑：下载 ---
  const handleDownload = () => {
    if (store.resultBlob) {
      const ext = store.exportSettings.format === 'gif' ? 'gif' : 'mp4';
      downloadBlob(store.resultBlob, `export.${ext}`);
      handleResetAndClose();
    } else if (store.jobId) {
      const finalUrl = store.downloadUrl || `${API_CLIENT.BASE_URL}/downloads/${store.jobId}.mp4`;
      const a = document.createElement('a');
      a.href = finalUrl;
      a.download = `video-${store.jobId.slice(0, 8)}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      handleResetAndClose();
    }
  };

  // --- 视图渲染路由 ---
  const renderContent = () => {
    if (isExporting) {
      return (
        <ProgressView 
          status={store.exportStatus}
          progress={store.exportProgress}
          message={store.statusMessage}
          startTime={store.startTime}
          onCancel={handleCancelTask}
          onBackground={handleClose}
        />
      );
    }
    
    if (isSuccess) {
      return <ResultView 
      onDownload={handleDownload}
      onClose={handleResetAndClose}  />;
    }

    if (localWarning.show) {
      return (
        <WarningView 
          issues={localWarning.issues} 
          onBack={() => setLocalWarning({ show: false, issues: [] })}
          onContinue={() => {
            const project = getProjectData();
            executeLocalExport(sanitizeProjectForFrontend(project));
          }}
        />
      );
    }

    return (
      <SelectionView 
        settings={store.exportSettings}
        isPremium={isPremium}
        onUpdateSettings={store.updateExportSettings}
        onLocalClick={onLocalExportClick}
        onCloudClick={onCloudExportClick}
      />
    );
  };

  return (
    <Modal
      isOpen={store.showExportModal}
      onClose={handleClose}
      title="导出视频"
      className="max-w-2xl"
    >
      <div className="p-6">
        {/* 只有在选择阶段显示设置面板 */}
        {!isExporting && !isSuccess && !localWarning.show && (
          <SettingsPanel 
            settings={store.exportSettings}
            isPremium={isPremium}
            onUpdate={store.updateExportSettings}
          />
        )}

        {store.exportError && (
          <div className="mb-6 p-3 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
            {store.exportError}
          </div>
        )}

        {renderContent()}
      </div>
    </Modal>
  );
}

// ==========================================
// 2. 内部子组件 (Views) - 让主逻辑更清晰
// ==========================================

// 2.1 设置面板 (分辨率/格式)
const SettingsPanel = ({ settings, isPremium, onUpdate }: any) => (
  <div className="space-y-5 mb-6 border-b border-border-primary pb-6">
    <div className="grid grid-cols-2 gap-6">
      <div>
        <label className="text-sm font-medium text-text-primary block mb-2">分辨率</label>
        <div className="flex space-x-2">
          {[720, 1080].map(res => (
            <button
              key={res}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center ${
                settings.resolution === res
                  ? 'bg-accent-purple text-white'
                  : 'bg-bg-tertiary hover:bg-border-primary text-text-secondary'
              } ${res === 1080 && !isPremium ? 'opacity-60' : ''}`}
              onClick={() => onUpdate({ resolution: res })}
            >
              {res}p {res === 1080 && !isPremium && <Lock className="w-3 h-3 ml-1.5 opacity-70" />}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-text-primary block mb-2">格式</label>
        <div className="flex space-x-2">
          {['mp4', 'gif'].map(fmt => (
            <button
              key={fmt}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center uppercase ${
                settings.format === fmt
                  ? 'bg-accent-purple text-white'
                  : 'bg-bg-tertiary hover:bg-border-primary text-text-secondary'
              } ${fmt === 'gif' && !isPremium ? 'opacity-60' : ''}`}
              onClick={() => onUpdate({ format: fmt })}
            >
              {fmt} {fmt === 'gif' && !isPremium && <Lock className="w-3 h-3 ml-1.5 opacity-70" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// 2.2 选择视图 (本地/云端按钮)
const SelectionView = ({ onLocalClick, onCloudClick, isPremium }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <button
      className="relative flex flex-col items-start p-5 border-2 border-border-primary bg-bg-tertiary/30 hover:border-accent-purple/50 hover:bg-bg-tertiary rounded-xl transition-all group text-left"
      onClick={onLocalClick}
    >
      <div className="mb-3 p-2 bg-bg-tertiary rounded-lg group-hover:text-accent-purple transition-colors">
        <Zap className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-text-primary mb-1 group-hover:text-accent-purple transition-colors">
        本地极速导出
      </h4>
      <p className="text-xs text-text-secondary mb-3 leading-relaxed">
        使用浏览器算力，速度快，无需上传。<br/>适合快速预览和简单剪辑。
      </p>
      <div className="mt-auto pt-3 w-full border-t border-border-primary/50">
        <span className="text-xs text-text-disabled flex items-center">
          不支持高级光晕/复杂动画
        </span>
      </div>
    </button>

    <button
      className={`relative flex flex-col items-start p-5 border-2 rounded-xl transition-all text-left group ${
        !isPremium 
          ? 'border-border-primary bg-bg-tertiary/10 opacity-80 hover:opacity-100' 
          : 'border-accent-purple/30 bg-accent-purple/5 hover:border-accent-purple hover:bg-accent-purple/10'
      }`}
      onClick={onCloudClick}
    >
      <div className="absolute top-3 right-3">
        {!isPremium ? (
          <span className="bg-bg-tertiary text-text-secondary text-xs px-2 py-1 rounded-full border border-border-primary">Pro</span>
        ) : (
          <span className="bg-accent-purple text-white text-xs px-2 py-1 rounded-full flex items-center"><Crown className="w-3 h-3 mr-1 fill-current" /> Pro</span>
        )}
      </div>
      <div className="mb-3 p-2 bg-bg-tertiary rounded-lg group-hover:text-accent-purple transition-colors">
        <Cloud className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-text-primary mb-1 group-hover:text-accent-purple transition-colors">
        云端完美渲染
      </h4>
      <p className="text-xs text-text-secondary mb-3 leading-relaxed">
        服务器后台渲染，完美复刻所有特效。<br/>支持 4K 画质和复杂动画。
      </p>
      <div className="mt-auto pt-3 w-full border-t border-border-primary/50">
        <span className="text-xs text-accent-green flex items-center">
          <CheckCircle2 className="w-3 h-3 mr-1" /> 100% 还原编辑器效果
        </span>
      </div>
    </button>
  </div>
);

// 2.3 进度视图 (导出中)
const ProgressView = ({ status, progress, message, startTime, onCancel, onBackground }: any) => {
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      setElapsed(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const getStatusText = () => {
    if (message) return message;
    if (status === 'preparing') return '正在分析工程...';
    if (status === 'uploading') return '正在上传资源...';
    if (['processing_backend', 'polling'].includes(status)) return '云端渲染中...';
    return '处理中...';
  };

  return (
    <div className="py-8 text-center relative flex flex-col items-center justify-center">
      <p className="text-text-primary font-medium mb-2 text-lg animate-pulse">
        {getStatusText()}
      </p>
      <div className="text-3xl font-bold text-accent-purple mb-5 font-mono tracking-wider">
        {elapsed}
      </div>
      <div className="w-64 mx-auto bg-bg-tertiary rounded-full h-1.5 mb-8 overflow-hidden relative">
        <div 
          className="bg-accent-purple h-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress, 1) * 100}%` }}
        />
        <div className="absolute inset-0 bg-white/10 animate-[shimmer_2s_infinite] w-full h-full"/>
      </div>
      <div className="flex items-center space-x-4">
        <button 
          onClick={onCancel}
          className="px-6 py-2.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm font-medium flex items-center space-x-2"
        >
          <Square className="w-4 h-4 fill-current" />
          <span>停止任务</span>
        </button>
        <button 
          onClick={onBackground}
          className="px-6 py-2.5 rounded border border-border-primary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all text-sm font-medium flex items-center space-x-2"
        >
          <X className="w-4 h-4" />
          <span>后台运行</span>
        </button>
      </div>
      <p className="text-text-disabled text-xs mt-4 opacity-70">
         {status === 'processing_frontend' 
          ? '正在使用浏览器算力，请勿关闭标签页' 
          : ['processing_backend', 'polling'].includes(status) 
            ? '服务器正在进行云端渲染，您可以关闭此窗口' 
            : '正在准备资源，请保持网络连接'
          }
      </p>
    </div>
  );
};

const ResultView = ({ onDownload, onClose }: any) => (
  <div className="py-6 text-center">
    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
      <CheckCircle2 className="w-6 h-6 text-green-500" />
    </div>
    <h3 className="text-lg font-medium text-text-primary mb-2">导出完成！</h3>
    <p className="text-text-secondary text-sm mb-6">您的视频已准备就绪。</p>
    
    <div className="flex items-center justify-center gap-4 w-full max-w-xs mx-auto">
      {/* 新增：关闭/重置按钮 */}
      <button
        className="flex-1 px-4 py-2.5 bg-bg-tertiary hover:bg-border-primary text-text-primary font-medium rounded transition-colors border border-transparent"
        onClick={onClose}
      >
        关闭
      </button>

      {/* 原有：下载按钮 */}
      <button
        className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors shadow-lg shadow-green-900/20"
        onClick={onDownload}
      >
        下载文件
      </button>
    </div>
  </div>
);

// 2.5 警告视图
const WarningView = ({ issues, onBack, onContinue }: any) => (
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
          {issues.map((issue: string) => (
            <span key={issue} className="px-2 py-1 bg-bg-tertiary border border-border-primary rounded text-xs text-text-secondary">
              {issue}
            </span>
          ))}
        </div>
        <p className="text-xs text-text-secondary mb-4">
          如果继续，这些特效将被<b className="text-text-primary">自动移除</b>。如需保留完美效果，请使用云端导出。
        </p>
        <div className="flex space-x-3">
          <button onClick={onBack} className="px-4 py-2 bg-bg-tertiary hover:bg-border-primary text-text-primary text-sm rounded font-medium transition-colors">
            返回
          </button>
          <button onClick={onContinue} className="flex-1 px-4 py-2 bg-yellow-600/90 hover:bg-yellow-600 text-white text-sm rounded font-medium transition-colors flex items-center justify-center">
            移除特效并继续 <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ==========================================
// 3. 悬浮 Toast 组件
// ==========================================
function ExportToast() {
  const { showExportModal, setShowExportModal, exportStatus, exportProgress } = useExportStore();
  const isExporting = ['preparing', 'uploading', 'processing_frontend', 'processing_backend', 'polling'].includes(exportStatus);
  const isSuccess = exportStatus === 'success';

  if (showExportModal || (!isExporting && !isSuccess)) return null;

  return (
    <button
      onClick={() => setShowExportModal(true)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-bg-secondary border border-border-primary rounded-lg shadow-xl hover:bg-bg-tertiary transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in group"
    >
      {isExporting ? (
        <>
          <div className="relative w-5 h-5">
            <Loader2 className="w-5 h-5 text-accent-purple animate-spin" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-text-primary">导出中... {Math.round(exportProgress * 100)}%</span>
            <span className="text-xs text-text-secondary">点击查看详情</span>
          </div>
        </>
      ) : (
        <>
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-text-primary">导出完成</span>
            <span className="text-xs text-text-secondary">点击下载文件</span>
          </div>
        </>
      )}
      <Maximize2 className="w-4 h-4 text-text-disabled group-hover:text-text-primary transition-colors ml-2" />
    </button>
  );
}

// ==========================================
// 4. 设置弹窗组件 (保持原样)
// ==========================================
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
          <h3 className="text-md font-medium text-text-primary border-b border-border-primary pb-2">水印</h3>
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="watermark-toggle" className="font-medium text-text-primary">启用项目水印</label>
              <p className="text-sm text-text-secondary">{!isPremium ? 'Pro 会员可移除水印' : '在视频上显示您的水印'}</p>
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
              <div className={`w-11 h-6 bg-bg-tertiary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${!isPremium && watermark.enabled ? 'cursor-not-allowed opacity-50' : 'peer-checked:bg-accent-purple'}`}></div>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}