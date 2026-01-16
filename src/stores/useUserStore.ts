import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 定义用户信息结构
interface UserInfo {
  id: string;
  nickname: string;
  avatar: string;
  vipLevel: 'free' | 'pro'; // 会员等级
}

interface UserState {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  
  // 认证弹窗状态
  authModalOpen: boolean;
  authMode: 'login' | 'register';
  
  // 个人资料弹窗状态
  profileModalOpen: boolean;
}
interface Window {
  electronAPI?: {
    saveAvatar: (buffer: ArrayBuffer, fileName: string) => Promise<string>;
  };
}

interface UserActions {
  // 动作
  login: (method: string, data: any) => Promise<void>;
  logout: () => void;
  
  // 弹窗控制
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  
  openProfileModal: () => void;
  closeProfileModal: () => void;
  
  // 更新资料
  updateProfile: (name: string, avatarFile: File | null) => Promise<void>;

  // 临时调试用
  _temp_togglePremium: () => void;
}

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      userInfo: null,
      authModalOpen: false,
      authMode: 'login',
      profileModalOpen: false,

      // 模拟登录
      login: async (method, data) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const mockUser: UserInfo = {
          id: 'u_123456',
          nickname: '用户',
          avatar: '/default-avatar.png',
          vipLevel: 'free',
        };
        set({ isLoggedIn: true, userInfo: mockUser, authModalOpen: false });
      },

      logout: () => {
        set({ isLoggedIn: false, userInfo: null });
      },

      openAuthModal: (mode = 'login') => set({ authModalOpen: true, authMode: mode }),
      closeAuthModal: () => set({ authModalOpen: false }),

      openProfileModal: () => set({ profileModalOpen: true }),
      closeProfileModal: () => set({ profileModalOpen: false }),

      // 更新个人资料
      updateProfile: async (name, avatarFile) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        const currentUser = get().userInfo;
        if (!currentUser) return;

        let newAvatarUrl = currentUser.avatar;
        if (newAvatarUrl.startsWith('blob:') || newAvatarUrl.startsWith('http')) {
             newAvatarUrl = '/default-avatar.png';
        }
        if (avatarFile) {
          
            try {
            const buffer = await avatarFile.arrayBuffer();
            
            if ((window as any).electronAPI) {
              newAvatarUrl = await (window as any).electronAPI.saveAvatar(buffer, avatarFile.name);
            } else {
              console.warn('Electron API not found');
              newAvatarUrl = URL.createObjectURL(avatarFile);
            }
          } catch (error) {
            console.error('Avatar save failed', error);
          }
        }

        set({
          userInfo: {
            ...currentUser,
            nickname: name,
            avatar: newAvatarUrl
          },
          profileModalOpen: false
        });
      },

      // 切换会员状态 (调试用)
      _temp_togglePremium: () => {
        const { userInfo } = get();
        if (!userInfo) return;
        set({
          userInfo: {
            ...userInfo,
            vipLevel: userInfo.vipLevel === 'free' ? 'pro' : 'free'
          }
        });
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ isLoggedIn: state.isLoggedIn, userInfo: state.userInfo }),
    }
  )
);



// 1. 获取登录状态
export const useIsLoggedIn = () => useUserStore((state) => state.isLoggedIn);

// 2. 获取用户信息
export const useUserInfo = () => useUserStore((state) => state.userInfo);

// 3. 【修复报错】获取会员状态
// 逻辑：如果用户信息存在且 vipLevel 为 'pro'，则返回 true
export const useIsPremium = () => useUserStore((state) => {
  return state.userInfo?.vipLevel === 'pro';
});