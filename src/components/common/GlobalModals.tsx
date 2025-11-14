import React, { useState } from 'react';
import { Modal } from './Modal';
import { useUIStore } from '@/stores/useUIStore';
import { useExportStore, type ExportStatus } from '@/stores/useExportStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useIsPremium } from '@/stores/useUserStore';
import { runFrontendExport } from '@/utils/frontendExporter';
import { downloadBlob } from '@/utils/fileUtils';

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
    exportError,
  } = useExportStore();
  const isPremium = useIsPremium();
  
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleStartExport = async () => {
    const requestedResolution = exportSettings.resolution;
    const requestedFormat = exportSettings.format;

    const needsPremium =
      requestedResolution > 720 || requestedFormat === 'gif';

    if (needsPremium && !isPremium) {
      setExportError('导出高清分辨率或 GIF 格式是 Pro 会员功能。');
      return;
    }

    try {
      setExportError(null);
      setResultBlob(null);
      setExportStatus('preparing');

      const blob = await runFrontendExport();

      setResultBlob(blob);
      setExportStatus('success');
      
    } catch (error) {
      console.error('Export failed:', error);
      const errorMsg = error instanceof Error ? error.message : '未知导出错误';
      setExportError(errorMsg);
      setExportStatus('idle');
    }
  };
  
  const handleSaveFile = () => {
    if (!resultBlob) return;

    const outputFilename =
      exportSettings.format === 'gif' ? 'export.gif' : 'export.mp4';

    downloadBlob(resultBlob, outputFilename);

    setShowExportModal(false);
    setExportStatus('idle');
    setResultBlob(null);
  };

  const isExporting =
    exportStatus === 'preparing' ||
    exportStatus === 'uploading' ||
    exportStatus === 'processing_frontend';

  const getExportingText = () => {
    const progress = Math.min(exportProgress, 1);
    const progressPercent = Math.round(progress * 100);

    switch (exportStatus) {
      case 'preparing':
        return '正在准备...';
      case 'uploading':
        return '正在加载媒体资源...';
      case 'processing_frontend':
        return `正在处理视频... ${progressPercent}%`;
      default:
        return '正在导出...';
    }
  };
  
  const clampedProgress = Math.min(exportProgress, 1);

  return (
    <Modal
      isOpen={showExportModal}
      onClose={() => {
        if (isExporting) return;
        setShowExportModal(false);
        setExportStatus('idle');
        setResultBlob(null);
      }}
      title="导出项目"
    >
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary block mb-2">
              分辨率
            </label>
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  exportSettings.resolution === 720
                    ? 'bg-accent-purple text-white'
                    : 'bg-bg-tertiary hover:bg-border-primary'
                }`}
                onClick={() => updateExportSettings({ resolution: 720 })}
                disabled={isExporting}
              >
                720p (标清)
              </button>
              <button
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  exportSettings.resolution === 1080
                    ? 'bg-accent-purple text-white'
                    : 'bg-bg-tertiary hover:bg-border-primary'
                } ${!isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => updateExportSettings({ resolution: 1080 })}
                disabled={!isPremium || isExporting}
                title={!isPremium ? '1080p 高清导出是 Pro 会员功能' : ''}
              >
                1080p (高清) {!isPremium && '🔒'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary block mb-2">
              格式
            </label>
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  exportSettings.format === 'mp4'
                    ? 'bg-accent-purple text-white'
                    : 'bg-bg-tertiary hover:bg-border-primary'
                }`}
                onClick={() => updateExportSettings({ format: 'mp4' })}
                disabled={isExporting}
              >
                MP4 (视频)
              </button>
              <button
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  exportSettings.format === 'gif'
                    ? 'bg-accent-purple text-white'
                    : 'bg-bg-tertiary hover:bg-border-primary'
                } ${!isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => updateExportSettings({ format: 'gif' })}
                disabled={!isPremium || isExporting}
                title={!isPremium ? 'GIF 导出是 Pro 会员功能' : ''}
              >
                GIF (动图) {!isPremium && '🔒'}
              </button>
            </div>
          </div>
        </div>

        {exportError && (
          <div className="my-4 p-3 bg-red-900 bg-opacity-50 text-red-200 border border-red-700 rounded text-sm">
            <strong>导出失败：</strong> {exportError}
          </div>
        )}

        <div className="pt-4">
          {isExporting ? (
            <div className="w-full">
              <p className="text-sm text-text-secondary text-center mb-2">
                {getExportingText()}
              </p>
              <div className="w-full bg-bg-tertiary rounded-full h-2">
                <div
                  className="bg-accent-purple h-2 rounded-full transition-all"
                  style={{ width: `${clampedProgress * 100}%` }}
                ></div>
              </div>
            </div>
          ) : exportStatus === 'success' && resultBlob ? (
            <button
              className="w-full px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
              onClick={handleSaveFile}
            >
              保存文件
            </button>
          ) : (
            <button
              className={`w-full px-3 py-1.5 text-white text-sm font-medium rounded transition-colors ${
                exportStatus === 'error'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-accent-purple hover:bg-purple-600'
              } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleStartExport}
              disabled={isExporting}
            >
              {exportStatus === 'error' ? '重试导出' : '开始导出'}
            </button>
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

    if (newEnabledState === false && !isPremium) {
      console.log('权限检查：Pro 会员才能移除水印。');
      return;
    }

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