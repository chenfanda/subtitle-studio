import { useState, useEffect } from 'react';
import { X, Smartphone, Mail, QrCode, Loader2, ArrowRight } from 'lucide-react';
import { useUserStore } from '@/stores/useUserStore';
import { api } from '@/utils/api';
import { useTranslation } from '@/hooks/useTranslation';

export function AuthModal() {
  const { authModalOpen, closeAuthModal, authMode, loginWithOTP, openAuthModal } = useUserStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'phone' | 'email' | 'wechat'>('phone');
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [account, setAccount] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!authModalOpen) return null;

  const handleSendOTP = async () => {
    if (!account) return setError(t('请输入账号'));
    setIsLoading(true);
    setError(null);
    try {
      await api.sendOTP(activeTab as any, account);
      setCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.error || t('发送失败'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!account || !code) return setError(t('请输入账号和验证码'));
    setIsLoading(true);
    setError(null);
    try {
      await loginWithOTP(activeTab as any, account, code);
      closeAuthModal();
    } catch (err: any) {
      setError(err.response?.data?.error || t('登录失败'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={closeAuthModal} />

      <div className="relative w-full max-w-md bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
              {authMode === 'login' ? t('欢迎回来') : t('开启创作之旅')}
            </h2>
            <p className="text-white/40 text-sm">
              {authMode === 'login' ? t('登录账号以保存您的项目') : t('注册即享免费高清导出')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 rounded-xl mb-6">
            {[
              { id: 'phone', icon: Smartphone, label: t('手机') },
              { id: 'email', icon: Mail, label: t('邮箱') },
              { id: 'wechat', icon: QrCode, label: t('微信') }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setAccount(''); setCode(''); setError(null); }}
                className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === tab.id
                  ? 'bg-[#27272a] text-white shadow-sm ring-1 ring-white/10'
                  : 'text-white/40 hover:text-white/70'
                  }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-4 min-h-[140px]">
            {activeTab === 'wechat' ? (
              <div className="flex flex-col items-center justify-center py-2 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-36 h-36 bg-white p-2 rounded-xl">
                  <div className="w-full h-full border-2 border-black/10 rounded-lg flex items-center justify-center">
                    <QrCode size={80} className="text-black" />
                  </div>
                </div>
                <p className="text-xs text-white/40">{t('请使用微信扫一扫登录')}</p>
                <p className="text-xs text-purple-400">({t('开发阶段模拟：暂不可用')})</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/40 ml-1">
                    {activeTab === 'phone' ? t('手机号码') : t('邮箱地址')}
                  </label>
                  <input
                    type="text"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/10 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/40 ml-1">
                    {t('验证码')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/10 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    />
                    <button
                      onClick={handleSendOTP}
                      disabled={isLoading || countdown > 0}
                      className="absolute right-2 top-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-purple-400 rounded-lg transition-all disabled:text-white/20"
                    >
                      {countdown > 0 ? `${countdown}s` : t('获取验证码')}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-red-500 ml-1">{error}</p>}

                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full mt-2 bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                    <>
                      {authMode === 'login' ? t('立即登录') : t('注册账号')}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-white/40">
              {authMode === 'login' ? t('还没有账号？') : t('已有账号？')}
              <button
                onClick={() => openAuthModal(authMode === 'login' ? 'register' : 'login')}
                className="text-white hover:text-purple-400 ml-1.5 font-medium transition-colors hover:underline"
              >
                {authMode === 'login' ? t('免费注册') : t('直接登录')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}