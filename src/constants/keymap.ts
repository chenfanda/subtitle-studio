export const KEYBOARD_SHORTCUTS = {
  // 播放控制
  PLAY_PAUSE: 'Space',
  FRAME_BACKWARD: 'ArrowLeft',
  FRAME_FORWARD: 'ArrowRight',
  SKIP_BACKWARD: 'Shift+ArrowLeft',
  SKIP_FORWARD: 'Shift+ArrowRight',
  VOLUME_UP: 'ArrowUp',
  VOLUME_DOWN: 'ArrowDown',
  
  // 编辑操作
  CONFIRM_EDIT: 'Enter',
  CANCEL_EDIT: 'Escape',
  DELETE_SELECTED: 'Delete',
  SELECT_ALL: 'Ctrl+A',
  COPY: 'Ctrl+C',
  PASTE: 'Ctrl+V',
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Y',
  
  // 导航
  NEXT_SUBTITLE: 'Tab',
  PREV_SUBTITLE: 'Shift+Tab',
  ZOOM_IN: 'Ctrl+Plus',
  ZOOM_OUT: 'Ctrl+Minus',
  FIT_TIMELINE: 'Ctrl+0',
  
  // 面板切换
  TOGGLE_LEFT_PANEL: 'Ctrl+B',
  FOCUS_SEARCH: 'Ctrl+F',
} as const;

export type KeyboardShortcut = keyof typeof KEYBOARD_SHORTCUTS;