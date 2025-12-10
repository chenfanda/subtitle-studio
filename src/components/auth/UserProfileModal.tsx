import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Save, Loader2, User } from 'lucide-react';
import { useUserStore } from '@/stores/useUserStore';

export function UserProfileModal() {
  const { profileModalOpen, closeProfileModal, userInfo, updateProfile } = useUserStore();
  
  const [name, setName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化数据
  useEffect(() => {
    if (profileModalOpen && userInfo) {
      setName(userInfo.nickname);
      setAvatarPreview(userInfo.avatar);
      setSelectedFile(null);
    }
  }, [profileModalOpen, userInfo]);

  if (!profileModalOpen || !userInfo) return null;

  // 处理图片选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // 创建临时预览地址
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  // 保存更改
  const handleSave = async () => {
    if (!name.trim()) return;
    
    setIsLoading(true);
    try {
      await updateProfile(name, selectedFile);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={closeProfileModal} />
      
      <div className="relative w-full max-w-md bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">编辑个人资料</h2>
          <button onClick={closeProfileModal} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-6">
          
          {/* 头像上传区域 */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-purple-500 transition-colors">
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              
              {/* 悬浮遮罩 */}
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white w-8 h-8" />
              </div>
            </div>
            <span className="text-xs text-white/40">点击更换头像</span>
            
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>

          {/* 昵称输入区域 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60 flex items-center gap-2">
              <User size={14} /> 昵称
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="请输入您的昵称"
            />
          </div>

          {/* 保存按钮 */}
          <button 
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            保存更改
          </button>
        </div>

      </div>
    </div>
  );
}