import React from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUserStore } from '@/stores/useUserStore';

export default function App() {
  // 注册全局键盘快捷键
  useKeyboardShortcuts();

  React.useEffect(() => {
    // 监听全局登出事件 (来自 api.ts)
    const handleLogout = () => {
      useUserStore.getState().logout();
    };

    window.addEventListener('auth:logout', handleLogout);

    // 启动时自检 Profile / Token 有效性
    // 延时一点执行避免 hydration 冲突
    const checkAuth = () => {
      useUserStore.getState().refreshUserInfo();
    };

    const timer = setTimeout(checkAuth, 500);

    // 窗口重新聚焦时也检测 (例如用户刚重启完服务切回来)
    window.addEventListener('focus', checkAuth);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('focus', checkAuth);
      clearTimeout(timer);
    };
  }, []);

  return <AppLayout />;
}