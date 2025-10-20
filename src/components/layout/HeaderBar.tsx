import React, { useState, useRef, useEffect } from 'react';
import { ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/outline';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUIStore } from '@/stores/useUIStore';
import { useHistoryStore } from '@/stores/useHistoryStore';

export function HeaderBar() {
  const { title, saveStatus, updateProjectTitle } = useProjectStore();
  const { toggleLeftPanel } = useUIStore();
  const { undo, redo, canUndo, canRedo } = useHistoryStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
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
  }, [isEditingTitle]);

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
      <div className="flex items-center space-x-4">
        <button 
          onClick={toggleLeftPanel}
          className="w-6 h-6 flex flex-col justify-center items-center hover:bg-bg-tertiary rounded transition-colors group"
          title="切换左侧面板 (Ctrl+B)"
        >
          <div className="w-4 h-0.5 bg-text-primary mb-1 transition-colors group-hover:bg-white"></div>
          <div className="w-4 h-0.5 bg-text-primary mb-1 transition-colors group-hover:bg-white"></div>
          <div className="w-4 h-0.5 bg-text-primary transition-colors group-hover:bg-white"></div>
        </button>
        
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

      <div className="flex-1 flex items-center justify-center">
      </div>

      <div className="flex items-center space-x-4">
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

        <div className={`flex items-center space-x-2 ${saveInfo.className}`}>
          <span className="text-sm">{saveInfo.icon}</span>
          <span className="text-sm font-medium">{saveInfo.text}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary"
            title="设置"
            onClick={() => useUIStore.getState().setShowSettingsModal(true)}
          >
            ⚙️
          </button>

          <button 
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary"
            title="帮助"
            onClick={() => useUIStore.getState().setShowHelpModal(true)}
          >
            ❓
          </button>

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