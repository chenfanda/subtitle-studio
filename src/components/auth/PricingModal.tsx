import { useState, useEffect } from 'react';
import { X, Check, Crown, Zap, Shield, Sparkles, Loader2 } from 'lucide-react';
import { useUserStore } from '@/stores/useUserStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Modal } from '../common/Modal';

const PLANS = [
    {
        id: 'weekly',
        name: '周度会员',
        price: '9.9',
        originalPrice: '19.9',
        description: '适合临时短期使用',
        duration: '7天',
        highlight: false,
    },
    {
        id: 'monthly',
        name: '月度会员',
        price: '29.9',
        originalPrice: '59.9',
        description: '最受欢迎的选择',
        duration: '30天',
        highlight: true,
    },
    {
        id: 'quarterly',
        name: '季度会员',
        price: '79.9',
        originalPrice: '159.9',
        description: '长效创作的首选',
        duration: '90天',
        highlight: false,
    },
    {
        id: 'yearly',
        name: '年度会员',
        price: '199.9',
        originalPrice: '399.9',
        description: '超值性价比之选',
        duration: '365天',
        highlight: false,
    },
];

const FEATURES = [
    '解除 720p 导出限制',
    '云端 1080p+ 极速渲染',
    'AI 降噪与人声增强',
    '尊贵皇冠标识',
    '项目历史云端同步',
    '多段视频无缝合并',
];

export function PricingModal() {
    const { t } = useTranslation();
    const { pricingModalOpen, closePricingModal, subscribe, userInfo } = useUserStore();
    const [selectedPlan, setSelectedPlan] = useState('monthly');
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'selection' | 'payment' | 'success'>('selection');
    const [error, setError] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'wechat' | 'paypal'>('alipay');

    // Reset state when modal opens or user changes
    useEffect(() => {
        if (pricingModalOpen) {
            setStep('selection');
            setError(null);
            setIsProcessing(false);
        }
    }, [pricingModalOpen, userInfo?.id]);

    if (!pricingModalOpen) return null;

    const handleStartPayment = () => {
        setError(null);
        setStep('payment');
    };

    const handleConfirmPayment = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            // Simulation of a backend verification delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            await subscribe(selectedPlan);
            setStep('success');
        } catch (err: any) {
            console.error('Subscription failed:', err);
            setError(err.response?.data?.error || err.message || '支付校验失败，请重试');
        } finally {
            setIsProcessing(false);
        }
    };

    const currentPlan = PLANS.find(p => p.id === selectedPlan);

    return (
        <Modal
            isOpen={pricingModalOpen}
            onClose={closePricingModal}
            title=""
            className="max-w-4xl bg-[#0f0f13] border-none p-0 overflow-hidden"
        >
            <div className="relative min-h-[600px] flex flex-col md:flex-row">

                {/* Left Side: Features & Branding */}
                <div className="w-full md:w-[35%] bg-gradient-to-br from-[#1e1e24] to-[#0f0f13] p-8 border-r border-white/5">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                            <Crown className="text-black w-6 h-6 fill-current" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">Subtitle Pro</span>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-6 leading-tight">
                        {t('开启创作')}<br /><span className="text-yellow-500">{t('无限可能')}</span>
                    </h2>

                    <div className="space-y-4">
                        {FEATURES.map((feature, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm text-gray-400">
                                <div className="mt-1 w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-green-500" />
                                </div>
                                <span>{t(feature)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-medium text-blue-400">{t('权益承诺')}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                            {t('您的订阅支持我们的研发团队能够为您提供更优质的 AI 服务。如遇技术问题无法使用 Pro 功能，我们将为您按比例退款。')}
                        </p>
                    </div>
                </div>

                {/* Right Side: Plans & Action */}
                <div className="flex-1 p-8 bg-[#0f0f13] relative">
                    <button
                        onClick={closePricingModal}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    {step === 'selection' ? (
                        <>
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-white mb-2">{t('选择您的订阅方案')}</h3>
                                <p className="text-sm text-gray-500">{t('您可以根据创作频率随时切换方案')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {PLANS.map((plan) => (
                                    <button
                                        key={plan.id}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`relative p-5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between group ${selectedPlan === plan.id
                                            ? 'border-yellow-500 bg-yellow-500/5 shadow-lg shadow-yellow-500/5'
                                            : 'border-white/5 bg-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        {plan.highlight && (
                                            <div className="absolute -top-3 left-4 px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-bold rounded-full">
                                                {t('最受欢迎')}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`font-bold transition-colors ${selectedPlan === plan.id ? 'text-yellow-500' : 'text-white'
                                                }`}>{t(plan.name)}</span>
                                            <span className="text-[10px] text-gray-500 font-medium px-2 py-0.5 bg-white/5 rounded-full">
                                                {t(plan.duration)}
                                            </span>
                                        </div>

                                        <div className="flex items-baseline gap-1 mt-auto">
                                            <span className="text-xs text-gray-400">¥</span>
                                            <span className="text-3xl font-black text-white">{plan.price}</span>
                                            <span className="text-xs text-gray-500 line-through">¥{plan.originalPrice}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl shadow-2xl shadow-yellow-500/20">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <span className="text-black/60 text-xs font-bold block mb-1">{t('待支付金额')}</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-black text-xs font-bold italic">CNY</span>
                                            <span className="text-black text-3xl font-black">{currentPlan?.price}</span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center border border-black/5">
                                        <Zap className="text-black w-6 h-6 fill-current" />
                                    </div>
                                </div>

                                <button
                                    onClick={handleStartPayment}
                                    className="w-full h-12 bg-black text-white font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group overflow-hidden relative"
                                >
                                    <Sparkles className="w-4 h-4 text-yellow-500 group-hover:rotate-12 transition-transform" />
                                    <span>{t('立即支付并开启权益')}</span>
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]" />
                                </button>
                            </div>
                        </>
                    ) : step === 'payment' ? (
                        <div className="h-full flex flex-col items-center justify-center p-4">
                            <div className="mb-6 text-center">
                                <h3 className="text-xl font-bold text-white mb-2">{paymentMethod === 'paypal' ? 'PayPal Checkout' : t('扫码支付')}</h3>
                                <p className="text-sm text-gray-500">{t('正在购买:')} {t(currentPlan?.name || '')} (¥{currentPlan?.price})</p>
                            </div>

                            {paymentMethod === 'paypal' ? (
                                <div className="w-full max-w-sm p-8 bg-white/5 rounded-3xl mb-8 border border-white/10 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                                    <div className="w-20 h-20 bg-[#003087] rounded-2xl flex items-center justify-center shadow-2xl">
                                        <span className="text-white font-black text-3xl italic">PP</span>
                                    </div>
                                    <p className="text-center text-xs text-gray-400 px-4">
                                        {t('海外用户将重定向至 PayPal 标准结算页面。')}
                                    </p>
                                </div>
                            ) : (
                                <div className="relative p-4 bg-white rounded-3xl mb-8 group shadow-2xl">
                                    <div className="w-56 h-56 bg-gray-100 flex items-center justify-center overflow-hidden rounded-2xl border-4 border-white">
                                        <img
                                            src={paymentMethod === 'alipay' ? "/images/alipay_qr.png" : "/images/wechat_qr.png"}
                                            alt="Mock QR"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className={`absolute -top-3 -right-3 px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-lg ${paymentMethod === 'alipay' ? 'bg-blue-500' : 'bg-green-500'
                                        }`}>
                                        {paymentMethod === 'alipay' ? t('支付宝扫码') : t('微信扫码')}
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mb-6 p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center animate-in fade-in slide-in-from-top-2">
                                    <Shield className="w-3 h-3 mr-2 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-3 w-full max-w-xs">
                                <button
                                    onClick={handleConfirmPayment}
                                    disabled={isProcessing}
                                    className="w-full h-12 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{t('正在校验支付结果...')}</span>
                                        </>
                                    ) : (
                                        <span>{paymentMethod === 'paypal' ? t('使用 PayPal 支付') : t('我已完成支付')}</span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setStep('selection')}
                                    disabled={isProcessing}
                                    className="w-full py-2 text-sm text-gray-500 hover:text-white transition-colors"
                                >
                                    {t('更换方案')}
                                </button>
                            </div>

                            <div className="mt-10 flex flex-col items-center gap-4">
                                <p className="text-[10px] text-gray-500 font-medium">{t('点击切换支付方式')}</p>
                                <div className="flex items-center gap-8">
                                    <button
                                        onClick={() => setPaymentMethod('alipay')}
                                        className={`transition-all duration-300 transform hover:scale-110 ${paymentMethod === 'alipay'
                                            ? 'opacity-100 grayscale-0 ring-2 ring-blue-500 ring-offset-4 ring-offset-[#0f0f13] rounded-xl'
                                            : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-80'
                                            }`}
                                    >
                                        <img src="/images/alipay.png" className="h-12 rounded-lg shadow-xl" alt="Alipay" />
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('wechat')}
                                        className={`transition-all duration-300 transform hover:scale-110 ${paymentMethod === 'wechat'
                                            ? 'opacity-100 grayscale-0 ring-2 ring-green-500 ring-offset-4 ring-offset-[#0f0f13] rounded-xl'
                                            : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-80'
                                            }`}
                                    >
                                        <img src="/images/wechatpay.png" className="h-12 rounded-lg shadow-xl" alt="WechatPay" />
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('paypal')}
                                        className={`transition-all duration-300 transform hover:scale-110 ${paymentMethod === 'paypal'
                                            ? 'opacity-100 grayscale-0 ring-2 ring-[#003087] ring-offset-4 ring-offset-[#0f0f13] rounded-xl'
                                            : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-80'
                                            }`}
                                    >
                                        <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center shadow-xl">
                                            <span className="text-[#003087] font-black text-xl italic leading-none">P</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                                <Check className="text-green-500 w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2">{t('订阅成功！')}</h2>
                            <p className="text-gray-400 text-sm mb-8">
                                {t('感谢您的支持，您的 Pro 权益已立即生效。')}<br />
                                {t('快去体验 1080p 云端导出吧！')}
                            </p>
                            <button
                                onClick={closePricingModal}
                                className="px-12 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform"
                            >
                                {t('开启创作之旅')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
