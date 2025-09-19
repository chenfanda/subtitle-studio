import { useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUIStore } from '@/stores/useUIStore';
import { useTimelineStore } from '@/stores/useTimelineStore';
import { KEYBOARD_SHORTCUTS } from '@/constants/keymap';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果用户在输入框中，跳过大部分快捷键
      const isInInputElement = (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      );

      // 构建快捷键字符串
      const shortcutKey = [
        e.ctrlKey && 'Ctrl',
        e.altKey && 'Alt',
        e.shiftKey && 'Shift',
        e.key
      ].filter(Boolean).join('+');

      // 获取 store 方法
      const { 
        togglePlayback, 
        setCurrentTime, 
        currentTime,
        setVolume,
        volume 
      } = useProjectStore.getState();

      const { 
        toggleLeftPanel,
        setSelectedSubtitles,
        selectedSubtitleIds,
        setEditingSubtitle
      } = useUIStore.getState();

      const { 
        zoomIn, 
        zoomOut, 
        fitToWindow 
      } = useTimelineStore.getState();

      // 播放控制快捷键（在输入框中也可用）
      switch (shortcutKey) {
        case KEYBOARD_SHORTCUTS.PLAY_PAUSE: // Space
          if (!isInInputElement) {
            e.preventDefault();
            togglePlayback();
          }
          break;

        case KEYBOARD_SHORTCUTS.VOLUME_UP: // ArrowUp
          if (!isInInputElement) {
            e.preventDefault();
            setVolume(Math.min(100, volume + 5));
          }
          break;

        case KEYBOARD_SHORTCUTS.VOLUME_DOWN: // ArrowDown
          if (!isInInputElement) {
            e.preventDefault();
            setVolume(Math.max(0, volume - 5));
          }
          break;

        case KEYBOARD_SHORTCUTS.FRAME_BACKWARD: // ArrowLeft
          if (!isInInputElement) {
            e.preventDefault();
            setCurrentTime(Math.max(0, currentTime - 1000)); // 1秒
          }
          break;

        case KEYBOARD_SHORTCUTS.FRAME_FORWARD: // ArrowRight
          if (!isInInputElement) {
            e.preventDefault();
            setCurrentTime(currentTime + 1000); // 1秒
          }
          break;

        case KEYBOARD_SHORTCUTS.SKIP_BACKWARD: // Shift+ArrowLeft
          if (!isInInputElement) {
            e.preventDefault();
            setCurrentTime(Math.max(0, currentTime - 5000)); // 5秒
          }
          break;

        case KEYBOARD_SHORTCUTS.SKIP_FORWARD: // Shift+ArrowRight
          if (!isInInputElement) {
            e.preventDefault();
            setCurrentTime(currentTime + 5000); // 5秒
          }
          break;
      }

      // 在输入框中时，只允许特定快捷键
      if (isInInputElement) {
        switch (shortcutKey) {
          case KEYBOARD_SHORTCUTS.CONFIRM_EDIT: // Enter
            // 在字幕编辑时确认编辑
            if (useUIStore.getState().editingSubtitleId) {
              setEditingSubtitle(null);
            }
            break;

          case KEYBOARD_SHORTCUTS.CANCEL_EDIT: // Escape
            // 取消编辑
            setEditingSubtitle(null);
            break;
        }
        return;
      }

      // 非输入框环境的快捷键
      switch (shortcutKey) {
        // 编辑操作
        case KEYBOARD_SHORTCUTS.DELETE_SELECTED: // Delete
          if (selectedSubtitleIds.length > 0) {
            e.preventDefault();
            const { deleteSubtitles } = useProjectStore.getState();
            deleteSubtitles(selectedSubtitleIds);
            setSelectedSubtitles([]);
          }
          break;

        case KEYBOARD_SHORTCUTS.SELECT_ALL: // Ctrl+A
          e.preventDefault();
          const { subtitles } = useProjectStore.getState();
          setSelectedSubtitles(subtitles.map(s => s.id));
          break;

        case KEYBOARD_SHORTCUTS.UNDO: // Ctrl+Z
          e.preventDefault();
          console.log('Undo - 将在完整版本中实现');
          break;

        case KEYBOARD_SHORTCUTS.REDO: // Ctrl+Y
          e.preventDefault();
          console.log('Redo - 将在完整版本中实现');
          break;

        // 导航快捷键
        case KEYBOARD_SHORTCUTS.NEXT_SUBTITLE: // Tab
          e.preventDefault();
          console.log('Next subtitle - 需要配合字幕数据实现');
          break;

        case KEYBOARD_SHORTCUTS.PREV_SUBTITLE: // Shift+Tab
          e.preventDefault();
          console.log('Previous subtitle - 需要配合字幕数据实现');
          break;

        // 缩放控制
        case KEYBOARD_SHORTCUTS.ZOOM_IN: // Ctrl+Plus
          e.preventDefault();
          zoomIn();
          break;

        case KEYBOARD_SHORTCUTS.ZOOM_OUT: // Ctrl+Minus
          e.preventDefault();
          zoomOut();
          break;

        case KEYBOARD_SHORTCUTS.FIT_TIMELINE: // Ctrl+0
          e.preventDefault();
          const { duration } = useProjectStore.getState();
          fitToWindow(duration, 800);
          break;

        // 面板控制
        case KEYBOARD_SHORTCUTS.TOGGLE_LEFT_PANEL: // Ctrl+B
          e.preventDefault();
          toggleLeftPanel();
          break;

        case KEYBOARD_SHORTCUTS.FOCUS_SEARCH: // Ctrl+F
          e.preventDefault();
          // 聚焦到搜索框
          const searchInput = document.querySelector('input[placeholder*="搜索"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
          break;

        // 开发阶段的调试快捷键
        case 'F12':
          // 允许开发者工具
          break;

        default:
          // 记录未处理的快捷键（开发阶段）
          if (e.ctrlKey || e.altKey || e.metaKey) {
            console.log('Unhandled shortcut:', shortcutKey);
          }
          break;
      }
    };

    // 注册事件监听
    document.addEventListener('keydown', handleKeyDown);

    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 提供快捷键帮助信息
  const getShortcutHelp = () => {
    return {
      播放控制: [
        { key: 'Space', description: '播放/暂停' },
        { key: '← / →', description: '逐秒前进/后退' },
        { key: 'Shift + ← / →', description: '快速跳转 (5秒)' },
        { key: '↑ / ↓', description: '调节音量' },
      ],
      编辑操作: [
        { key: 'Delete', description: '删除选中字幕' },
        { key: 'Ctrl + A', description: '全选字幕' },
        { key: 'Ctrl + Z', description: '撤销' },
        { key: 'Ctrl + Y', description: '重做' },
      ],
      导航: [
        { key: 'Tab', description: '下一个字幕' },
        { key: 'Shift + Tab', description: '上一个字幕' },
        { key: 'Enter', description: '确认编辑' },
        { key: 'Escape', description: '取消编辑' },
      ],
      界面控制: [
        { key: 'Ctrl + B', description: '切换左侧面板' },
        { key: 'Ctrl + F', description: '聚焦搜索' },
        { key: 'Ctrl + +/-', description: '缩放时间轴' },
        { key: 'Ctrl + 0', description: '适合窗口' },
      ],
    };
  };

  return { getShortcutHelp };
}