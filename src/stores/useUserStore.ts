import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/utils/api';

interface UserInfo {
  id: string;
  nickname: string;
  avatar: string;
  vipLevel: 'free' | 'pro';
  vipExpiresAt?: string | null;
}

interface UserState {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;

  authModalOpen: boolean;
  authMode: 'login' | 'register';
  profileModalOpen: boolean;
  pricingModalOpen: boolean;
}

interface UserActions {
  loginWithOTP: (type: 'email' | 'phone', account: string, code: string) => Promise<void>;
  logout: () => Promise<void>;

  updateProfile: (name: string, avatarFile: File | null) => Promise<void>;
  refreshUserInfo: () => Promise<void>;
  subscribe: (planId: string) => Promise<void>;

  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  openPricingModal: () => void;
  closePricingModal: () => void;

  // Legacy support for older components (marked as deprecated internally)
  login: (method: string, data: any) => Promise<void>;
}

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      userInfo: null,
      accessToken: null,
      refreshToken: null,
      authModalOpen: false,
      authMode: 'login',
      profileModalOpen: false,
      pricingModalOpen: false,

      loginWithOTP: async (type, account, code) => {
        try {
          const res: any = await api.loginOTP(type, account, code);
          set({
            isLoggedIn: true,
            userInfo: res.user,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            authModalOpen: false,
          });
        } catch (error) {
          throw error;
        }
      },

      // Keep for compatibility during transition
      login: async (_method, _data) => {
        // Removed legacy simulation logic as requested for production transformation
      },

      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          try {
            await api.logout(refreshToken);
          } catch (e) { }
        }
        set({
          isLoggedIn: false,
          userInfo: null,
          accessToken: null,
          refreshToken: null,
          authModalOpen: false,
          profileModalOpen: false,
          pricingModalOpen: false
        });
        localStorage.removeItem('user-storage');
      },

      openAuthModal: (mode = 'login') => set({ authModalOpen: true, authMode: mode }),
      closeAuthModal: () => set({ authModalOpen: false }),
      openProfileModal: () => set({ profileModalOpen: true }),
      closeProfileModal: () => set({ profileModalOpen: false }),
      openPricingModal: () => set({ pricingModalOpen: true }),
      closePricingModal: () => set({ pricingModalOpen: false }),

      refreshUserInfo: async () => {
        const { accessToken, logout } = get();
        if (!accessToken) return;

        try {
          const res: any = await api.getProfile();
          set({
            userInfo: res.user,
            isLoggedIn: true
          });
        } catch (error: any) {
          console.error('Failed to refresh user info:', error);
          // If 401/403, we must logout immediately to fix the UI state
          if (error.response?.status === 401 || error.response?.status === 403) {
            await logout();
          }
        }
      },

      subscribe: async (planId) => {
        try {
          const res: any = await api.subscribe(planId);
          // The backend returns the updated user object
          set({ userInfo: res.user });
        } catch (error) {
          throw error;
        }
      },

      updateProfile: async (name, _avatarFile) => {
        // Real profile update logic should call a backend API
        // For now, we'll keep it as is but mark for future backend integration
        const { userInfo } = get();
        if (!userInfo) return;

        // Optionally call a backend API here: await api.updateProfile({ nickname: name, ... })

        set({
          userInfo: { ...userInfo, nickname: name },
          profileModalOpen: false
        });
        // We might want to call refreshUserInfo() here if we had a backend API
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        userInfo: state.userInfo,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken
      }),
      onRehydrateStorage: () => (state) => {
        // Automatically refresh user info on app load if tokens exist
        if (state?.accessToken && !state.userInfo) {
          state.refreshUserInfo();
        }
      }
    }
  )
);

export const useIsLoggedIn = () => useUserStore((state) => state.isLoggedIn);
export const useUserInfo = () => useUserStore((state) => state.userInfo);
export const useIsPremium = () => useUserStore((state) => state.userInfo?.vipLevel === 'pro');