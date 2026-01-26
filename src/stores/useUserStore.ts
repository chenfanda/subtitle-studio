import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserInfo {
  id: string;
  nickname: string;
  avatar: string;
  vipLevel: 'free' | 'pro';
}

interface UserState {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;

  authModalOpen: boolean;
  authMode: 'login' | 'register';


  profileModalOpen: boolean;
}
interface Window {
  electronAPI?: {
    saveAvatar: (buffer: ArrayBuffer, fileName: string) => Promise<string>;
  };
}

interface UserActions {

  login: (method: string, data: any) => Promise<void>;
  logout: () => void;


  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;

  openProfileModal: () => void;
  closeProfileModal: () => void;


  updateProfile: (name: string, avatarFile: File | null) => Promise<void>;


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



export const useIsLoggedIn = () => useUserStore((state) => state.isLoggedIn);

export const useUserInfo = () => useUserStore((state) => state.userInfo);


export const useIsPremium = () => useUserStore((state) => {
  return state.userInfo?.vipLevel === 'pro';
});