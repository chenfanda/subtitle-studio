import React, { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUIStore } from '@/stores/useUIStore';

export function HeaderBar() {
  const { title, saveStatus, updateProjectTitle } = useProjectStore();
  const { toggleLeftPanel } = useUIStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  // 当编辑状态改变时，聚焦输入框
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSubmit = () => {
    const trimmedTitle = editingTitle.trim();
    if (trimmedTitle && trimmedTitle !== title) {
      updateProjectTitle(trimmedTitle);
    } else {
      setEditingTitle(title); // 恢复原标题
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

  const getSaveStatusInfo = () => {
    switch (saveStatus) {
      case 'saved':
        return { 
          icon: '☁️', 
          text: '已保存',
          className: 'text-accent-green'
        };
      case 'saving':
        return { 
          icon: '⏳', 
          text: '保存中...',
          className: 'text-accent-yellow'
        };
      case 'unsaved':
        return { 
          icon: '●', 
          text: '未保存',
          className: 'text-accent-yellow'
        };
      case 'error':
        return { 
          icon: '❌', 
          text: '保存失败',
          className: 'text-accent-red'
        };
      default:
        return { 
          icon: '☁️', 
          text: '已保存',
          className: 'text-accent-green'
        };
    }
  };

  const saveInfo = getSaveStatusInfo();

  return (
    <div className="h-12 bg-bg-secondary flex items-center px-4 border-b border-border-primary select-none">
      {/* 左侧控制区 */}
      <div className="flex items-center space-x-4">
        {/* 汉堡菜单按钮 */}
        <button 
          onClick={toggleLeftPanel}
          className="w-6 h-6 flex flex-col justify-center items-center hover:bg-bg-tertiary rounded transition-colors group"
          title="切换左侧面板 (Ctrl+B)"
        >
          <div className="w-4 h-0.5 bg-text-primary mb-1 transition-colors group-hover:bg-white"></div>
          <div className="w-4 h-0.5 bg-text-primary mb-1 transition-colors group-hover:bg-white"></div>
          <div className="w-4 h-0.5 bg-text-primary transition-colors group-hover:bg-white"></div>
        </button>
        
        {/* 项目标题 */}
        <div className="flex items-center min-w-0">
          {isEditingTitle ? (
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
              onClick={() => setIsEditingTitle(true)}
              className="text-text-primary text-lg font-medium cursor-pointer hover:text-white transition-colors truncate max-w-xs"
              title={`点击编辑项目标题: ${title}`}
            >
              {title}
            </h1>
          )}
          
          {saveStatus === 'unsaved' && (
            <span className="ml-2 text-accent-yellow text-sm">•</span>
          )}
        </div>
      </div>

      {/* 中央区域 - 可扩展用于添加更多功能 */}
      <div className="flex-1 flex items-center justify-center">
        {/* 这里可以添加播放控制按钮或其他功能 */}
      </div>

      {/* 右侧状态区 */}
      <div className="flex items-center space-x-4">
        {/* 保存状态指示 */}
        <div className={`flex items-center space-x-2 ${saveInfo.className}`}>
          <span className="text-sm">{saveInfo.icon}</span>
          <span className="text-sm font-medium">{saveInfo.text}</span>
        </div>

        {/* 用户操作菜单 */}
        <div className="flex items-center space-x-2">
          {/* 设置按钮 */}
          <button 
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary"
            title="设置"
            onClick={() => useUIStore.getState().setShowSettingsModal(true)}
          >
            ⚙️
          </button>

          {/* 帮助按钮 */}
          <button 
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary"
            title="帮助"
            onClick={() => useUIStore.getState().setShowHelpModal(true)}
          >
            ❓
          </button>

          {/* 导出按钮 */}
          <button 
            className="px-3 py-1.5 bg-accent-purple hover:bg-purple-600 text-white text-sm font-medium rounded transition-colors"
            title="导出项目"
            onClick={() => useUIStore.getState().setShowExportModal(true)}
          >
            导出
          </button>
        </div>
      </div>
    </div>
  );
}