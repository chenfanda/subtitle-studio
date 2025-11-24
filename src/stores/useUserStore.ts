import { create } from 'zustand';

interface UserState {
  isPremium: boolean;
  // userProfile: any | null; // (未来) 可以在此扩展
}

interface UserActions {
  // (未来) 您可以在此处添加 login/logout/checkAuth
  
  // 这是一个临时方法，用于在开发中测试权限切换
  _temp_togglePremium: () => void;
}

export const useUserStore = create<UserState & UserActions>()((set) => ({
  isPremium: true, // 默认所有用户都是免费版
  // userProfile: null,
  
  _temp_togglePremium: () => {
    set((state) => {
      console.log('DEV: 切换会员状态为', !state.isPremium);
      return { isPremium: !state.isPremium };
    });
  },
}));

/**
 * 导出一个高性能的 hook，用于在组件中订阅会员状态。
 */
export const useIsPremium = () => useUserStore((state) => state.isPremium);