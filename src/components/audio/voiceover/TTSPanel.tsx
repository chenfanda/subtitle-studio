import { useEffect, useState } from 'react';
import { useVoiceoverStore } from '@/stores/useVoiceoverStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { Loader2, Mic, Play, RefreshCw, AlertCircle, User, CheckCircle2,X } from 'lucide-react';

// 定义组件 Props
interface TTSPanelProps {
  targetSubtitleId: string;
}

export function TTSPanel({ targetSubtitleId }: TTSPanelProps) {
  const { 
    generateTTS, 
    isGenerating, 
    systemCharacters, 
    userVoices, 
    currentConfig, 
    updateConfig,
    loadVoices ,
    error,       
    clearError 
  } = useVoiceoverStore();
  
  const subtitle = useSubtitleStore(state => 
    state.subtitles.find(s => s.id === targetSubtitleId)
  );

  const [text, setText] = useState(subtitle?.text || '');
  
  // activeTab 控制显示哪个列表，同时与 currentConfig.type 保持同步
  const [activeTab, setActiveTab] = useState<'system' | 'custom'>('system');
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 初始化加载
  useEffect(() => {
    const initData = async () => {
      setIsLoadingVoices(true);
      try {
        await loadVoices();
      } catch (err) {
        setLoadError('加载失败');
      } finally {
        setIsLoadingVoices(false);
      }
    };
    initData();
  }, []);

  // 监听 Store 变化，确保 Tab 状态与 Store 中的 type 一致 (用于回显)
  useEffect(() => {
    if (currentConfig.type) {
      setActiveTab(currentConfig.type);
    }
  }, [currentConfig.type]);

  // 处理 Tab 切换：切换时自动选中该列表的第一个选项
  const handleTabChange = (type: 'system' | 'custom') => {
    setActiveTab(type);
    
    if (type === 'system') {
      if (systemCharacters.length > 0) {
        // [修复] 兼容后端可能返回 character_id 或 id 的情况
        const firstChar = systemCharacters[0];
        const firstId = firstChar.id || (firstChar as any).character_id;
        if (firstId) {
          updateConfig({ type: 'system', voiceId: firstId });
        }
      }
    } else {
      if (userVoices.length > 0) {
        updateConfig({ type: 'custom', voiceId: userVoices[0].voice_id });
      }
    }
  };

  const handleVoiceSelect = (id: string, type: 'system' | 'custom') => {
    updateConfig({ 
      voiceId: id, 
      type: type 
    });
  };

  const handleGenerate = () => {
    if (!subtitle) return;
    const subtitleWithText = { ...subtitle, text: text };
    generateTTS(subtitleWithText);
  };

  return (
    <div className="p-5 space-y-5 h-full flex flex-col">
      {/* 1. 角色类型切换 Tab */}
      <div className="flex bg-bg-tertiary rounded-lg p-1 border border-border-secondary">
        <button
          onClick={() => handleTabChange('system')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
            activeTab === 'system' 
              ? 'bg-bg-primary shadow-sm text-accent-purple font-semibold' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <User size={14} />
          系统角色
        </button>
        <button
          onClick={() => handleTabChange('custom')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
            activeTab === 'custom' 
              ? 'bg-bg-primary shadow-sm text-accent-purple font-semibold' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Mic size={14} />
          我的音色
        </button>

        {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}
      </div>

      {/* 2. 角色选择列表 */}
      <div className="flex-1 min-h-[200px] flex flex-col">
        <div className="flex justify-between items-center mb-2 px-1">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            {activeTab === 'system' ? '选择预设模型' : '选择克隆音色'}
          </label>
          <button 
            onClick={() => loadVoices()} 
            className="text-xs text-text-tertiary hover:text-accent-purple flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={10} /> 刷新
          </button>
        </div>

        <div className="flex-1 border border-border-secondary rounded-xl bg-bg-tertiary overflow-y-auto p-2">
          {isLoadingVoices ? (
            <div className="h-full flex flex-col items-center justify-center text-text-secondary gap-3">
              <Loader2 className="animate-spin text-accent-purple" size={32} />
              <span className="text-sm font-medium">加载角色库中...</span>
            </div>
          ) : loadError ? (
            <div className="h-full flex flex-col items-center justify-center text-red-500 gap-2 p-4 text-center">
              <AlertCircle size={24} />
              <span className="text-sm">{loadError}</span>
              <button 
                onClick={() => loadVoices()} 
                className="mt-2 px-4 py-1.5 bg-white border border-red-200 rounded-full text-xs hover:bg-red-50 transition-colors"
              >
                重试连接
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {activeTab === 'system' ? (
                // --- 系统角色列表 ---
                systemCharacters.length > 0 ? (
                  systemCharacters.map((char, index) => {
                    // [修复] 获取真实的 ID，处理字段名可能不一致的问题 (id vs character_id)
                    const charId = char.id || (char as any).character_id;
                    
                    // [修复] 增加 !!charId 判断，防止 undefined === undefined 导致全选
                    const isSelected = !!charId && currentConfig.voiceId === charId && currentConfig.type === 'system';
                    
                    return (
                      <button
                        key={charId || index}
                        onClick={() => charId && handleVoiceSelect(charId, 'system')}
                        className={`
                          relative p-3 rounded-xl border text-left transition-all duration-200 flex items-start gap-3 group
                          ${isSelected
                            ? 'border-accent-purple bg-accent-purple/10 ring-1 ring-accent-purple shadow-sm'
                            : 'border-border-secondary bg-bg-primary hover:border-accent-purple/50 hover:shadow-md'
                          }
                        `}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 text-accent-purple">
                            <CheckCircle2 size={16} fill="currentColor" className="text-white" />
                          </div>
                        )}
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-colors
                          ${isSelected ? 'bg-accent-purple text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}
                        `}>
                          {char.avatar_url ? (
                            <img src={char.avatar_url} alt={char.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className={`text-sm font-semibold truncate ${isSelected ? 'text-accent-purple' : 'text-text-primary'}`}>
                            {char.name}
                          </div>
                          <div className="text-xs text-text-secondary flex items-center gap-1">
                            <span>{char.gender === 'female' ? '女声' : char.gender === 'male' ? '男声' : '通用'}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-2 py-10 text-center text-text-tertiary text-sm">
                    暂无系统角色
                  </div>
                )
              ) : (
                // --- 自定义音色列表 ---
                userVoices.length > 0 ? (
                  userVoices.map(voice => {
                    const isSelected = currentConfig.voiceId === voice.voice_id && currentConfig.type === 'custom';
                    return (
                      <button
                        key={voice.voice_id}
                        onClick={() => handleVoiceSelect(voice.voice_id, 'custom')}
                        className={`
                          relative p-3 rounded-xl border text-left transition-all duration-200 flex items-start gap-3 group
                          ${isSelected
                            ? 'border-accent-purple bg-accent-purple/10 ring-1 ring-accent-purple shadow-sm'
                            : 'border-border-secondary bg-bg-primary hover:border-accent-purple/50 hover:shadow-md'
                          }
                        `}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 text-accent-purple">
                            <CheckCircle2 size={16} fill="currentColor" className="text-white" />
                          </div>
                        )}
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-colors
                          ${isSelected ? 'bg-accent-purple text-white' : 'bg-indigo-50 text-indigo-400 group-hover:bg-indigo-100'}
                        `}>
                          <Mic size={20} />
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className={`text-sm font-semibold truncate ${isSelected ? 'text-accent-purple' : 'text-text-primary'}`}>
                            {voice.voice_name}
                          </div>
                          <div className="text-xs text-text-secondary opacity-80">
                            自定义克隆
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-2 py-10 flex flex-col items-center justify-center text-text-tertiary gap-3">
                    <div className="w-12 h-12 rounded-full bg-bg-primary flex items-center justify-center">
                      <Mic size={24} className="opacity-20" />
                    </div>
                    <div className="text-sm">暂无自定义音色</div>
                    <p className="text-xs max-w-[200px] text-center opacity-70">
                      请使用"原声提取"或"上传"功能添加您的第一个克隆音色
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. 参数调节 */}
      <div className="grid grid-cols-2 gap-4 bg-bg-tertiary p-4 rounded-xl border border-border-secondary">
        <div>
          <label className="text-xs font-medium text-text-secondary mb-2 flex justify-between">
            <span>语速 (Speed)</span>
            <span className="text-accent-purple font-mono bg-accent-purple/10 px-1.5 rounded">{currentConfig.speed}x</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={currentConfig.speed}
            onChange={(e) => updateConfig({ speed: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent-purple"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-secondary mb-2 flex justify-between">
            <span>音调 (Pitch)</span>
            <span className="text-accent-purple font-mono bg-accent-purple/10 px-1.5 rounded">{currentConfig.pitch}</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={currentConfig.pitch}
            onChange={(e) => updateConfig({ pitch: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent-purple"
          />
        </div>
      </div>

      {/* 4. 文本编辑 */}
      <div className="flex-shrink-0">
        <label className="text-xs font-medium text-text-secondary mb-1.5 block">配音文本 (Prompt)</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full p-3 bg-bg-tertiary border border-border-secondary rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-all resize-none text-sm leading-relaxed"
          placeholder="输入要生成的文本..."
        />
      </div>

      {/* 5. 生成按钮 */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !text.trim() || !currentConfig.voiceId}
        className="
          w-full py-3.5 rounded-xl bg-accent-purple text-white font-medium transition-all
          hover:bg-accent-purple/90 hover:shadow-lg hover:shadow-accent-purple/20 hover:-translate-y-0.5
          active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none
          flex items-center justify-center gap-2
        "
      >
        {isGenerating ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>AI 正在合成音频...</span>
          </>
        ) : (
          <>
            <Play size={20} fill="currentColor" />
            <span>立即生成配音</span>
          </>
        )}
      </button>
    </div>
  );
}