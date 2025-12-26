import React, { useState, useRef, useEffect } from 'react';
import { ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/outline';
import {
  LogOut,
  Crown,
  Settings,
  UserCog,
  Eraser
} from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUIStore } from '@/stores/useUIStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { useExportStore } from '@/stores/useExportStore'; 
import { useUserStore } from '@/stores/useUserStore';
import { MaskControlPanel } from '../video/MaskControlPanel';

export function HeaderBar() {
  const { exportStatus } = useExportStore();
  const isExporting = ['preparing', 'uploading', 'processing_frontend', 'processing_backend', 'polling'].includes(exportStatus);
  
  // 1. 获取 appStage，用于判断当前页面
  const { title, updateProjectTitle, appStage } = useProjectStore(); 
  
  const { toggleLeftPanel } = useUIStore();
  const { undo, redo, canUndo, canRedo } = useHistoryStore();
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { isLoggedIn, userInfo, logout, openAuthModal, _temp_togglePremium, openProfileModal } = useUserStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
   const [showMaskPanel, setShowMaskPanel] = useState(false);

  // 判断是否是编辑模式（只有编辑模式才显示 撤销/重做/导出/设置/侧边栏切换）
  const isEditingMode = appStage === 'editing';

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    // 只有在编辑模式下才监听快捷键
    if (!isEditingMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingTitle) return;
      
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      
      if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditingTitle, isEditingMode]); 

  const handleTitleSubmit = () => {
    const trimmedTitle = editingTitle.trim();
    if (trimmedTitle && trimmedTitle !== title) {
      updateProjectTitle(trimmedTitle);
    } else {
      setEditingTitle(title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditingTitle(title);
      setIsEditingTitle(false);
    }
  };

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  return (
    <div className="h-12 bg-bg-primary flex items-center px-4 border-b border-border-primary select-none shrink-0 z-50 relative">
      <div className="flex items-center space-x-4">
        {/* 只有编辑模式显示侧边栏切换 */}
        {isEditingMode && (
          <button 
            onClick={toggleLeftPanel}
            className="w-6 h-6 flex flex-col justify-center items-center hover:bg-bg-tertiary rounded transition-colors group"
            title="切换左侧面板 (Ctrl+B)"
          >
            <div className="w-4 h-0.5 bg-text-primary mb-1 transition-colors group-hover:bg-white"></div>
            <div className="w-4 h-0.5 bg-text-primary mb-1 transition-colors group-hover:bg-white"></div>
            <div className="w-4 h-0.5 bg-text-primary transition-colors group-hover:bg-white"></div>
          </button>
        )}
        
        <div className="flex items-center min-w-0">
          {/* 编辑模式下允许改名，上传模式下只显示静态标题 */}
          {isEditingMode && isEditingTitle ? (
            <input
              ref={inputRef}
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleTitleKeyDown}
              className="bg-transparent text-text-primary text-lg font-medium outline-none min-w-0 max-w-xs border-b border-accent-purple"
              maxLength={50}
              placeholder="项目标题"
            />
          ) : (
            <h1 
              onClick={() => isEditingMode && setIsEditingTitle(true)}
              className={`text-text-primary text-lg font-medium truncate max-w-xs ${isEditingMode ? 'cursor-pointer hover:text-white transition-colors' : ''}`}
              title={isEditingMode ? `点击编辑项目标题: ${title}` : 'Magic Cut'}
            >
              {isEditingMode ? title : 'Magic Cut'}
            </h1>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
      </div>

      <div className="flex items-center space-x-4">
        
        {/* 只有编辑模式才显示工具按钮 */}
        {isEditingMode && (
          <>
            <div className="flex items-center space-x-1">
              <button 
                onClick={handleUndo}
                disabled={!canUndo()}
                className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                  canUndo() 
                    ? 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary' 
                    : 'text-text-disabled cursor-not-allowed'
                }`}
                title="撤销 (Ctrl+Z)"
              >
                <ArrowUturnLeftIcon className="w-5 h-5" />
              </button>
              
              <button 
                onClick={handleRedo}
                disabled={!canRedo()}
                className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                  canRedo() 
                    ? 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary' 
                    : 'text-text-disabled cursor-not-allowed'
                }`}
                title="重做 (Ctrl+Y)"
              >
                <ArrowUturnRightIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
               <div className="relative">
                <button 
                  onClick={() => setShowMaskPanel(!showMaskPanel)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                    showMaskPanel 
                      ? 'bg-accent-purple text-white' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                  }`}
                  title="去除原始字幕 / 遮挡工具"
                >
                  <Eraser className="w-5 h-5" />
                </button>

                {showMaskPanel && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowMaskPanel(false)} 
                    />
                    <div className="absolute top-full mt-2 right-0 bg-[#1e1e24] border border-border-secondary rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      <MaskControlPanel />
                    </div>
                  </>
                )}
              </div>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary"
                title="设置"
                onClick={() => useUIStore.getState().setShowSettingsModal(true)}
              >
                <Settings className="w-5 h-5" />
              </button>

              <button 
                className={`px-3 py-1.5 text-sm font-medium rounded transition-all flex items-center justify-center min-w-[60px] ${
                  isExporting 
                    ? 'bg-accent-purple/80 text-white animate-pulse ring-1 ring-accent-purple/50' 
                    : 'bg-accent-purple hover:bg-purple-600 text-white'
                }`}
                title={isExporting ? "导出任务运行中 (点击查看详情)" : "导出项目"}
                onClick={() => useExportStore.getState().setShowExportModal(true)}
              >
                <span>{isExporting ? '导出中' : '导出'}</span>
              </button>
              
              <div className="w-px h-6 bg-border-secondary mx-2"></div>
            </div>
          </>
        )}

        {/* 用户区域 (全阶段显示) */}
        {isLoggedIn && userInfo ? (
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 hover:bg-bg-tertiary p-1 pr-2 rounded-full transition-colors"
            >
              <img src={userInfo.avatar} alt="Avatar" className="w-7 h-7 rounded-full bg-gray-700 object-cover" />
              {userInfo.vipLevel === 'pro' && (
                <Crown size={14} className="text-yellow-400 fill-yellow-400" />
              )}
            </button>

            {/* 用户下拉菜单 */}
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                <div className="absolute right-0 top-10 w-48 bg-[#1e1e24] border border-white/10 rounded-xl shadow-xl z-50 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-medium text-white truncate">{userInfo.nickname}</p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {userInfo.vipLevel === 'pro' ? '尊贵会员' : '免费用户'}
                    </p>
                  </div>
                    <button 
                    onClick={() => { openProfileModal(); setShowUserMenu(false); }}
                    className="px-4 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
                  >
                    <UserCog size={14} />
                    个人设置
                  </button>
                  <button 
                     onClick={() => { _temp_togglePremium(); setShowUserMenu(false); }}
                     className="px-4 py-2 text-left text-sm text-yellow-500 hover:bg-white/5 flex items-center gap-2 transition-colors"
                  >
                    <Crown size={14} />
                    {userInfo.vipLevel === 'pro' ? '切换为免费版' : '模拟升级会员'}
                  </button>

                  <button 
                    onClick={() => { logout(); setShowUserMenu(false); }}
                    className="px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={14} /> 退出登录
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="text-sm font-medium text-text-primary hover:text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full transition-all"
          >
            登录 / 注册
          </button>
        )}
      </div>
    </div>
  );
}