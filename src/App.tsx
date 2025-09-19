import React from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  // 注册全局键盘快捷键
  useKeyboardShortcuts();

  return <AppLayout />;
}