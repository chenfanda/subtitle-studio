import { useEffect, useMemo, useState, useRef } from 'react';
import { useVoiceoverStore } from '@/stores/useVoiceoverStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { 
  Loader2, Users, Wand2, ChevronDown, ChevronRight, CheckSquare, Square, 
  AlertCircle, Mic, Trash2, Sparkles, Activity, FileAudio, 
  Edit3, Save, X, FileText, FileType, AlignLeft
} from 'lucide-react';
import { SubtitleItem } from '@/types/subtitle';
import { sliceAudioFromUrl } from '@/utils/audioSlicer';
import { ttsService } from '@/utils/ttsService'; 
import { parseSRT, msToSRTTime } from '@/utils/subtitleParser'; 

type BatchMode = 'standard' | 'dynamic' | 'smart_dub';
type EditorMode = 'original' | 'script' | null;

export function BatchVoiceoverPanel() {
  const { 
    systemCharacters, userVoices, loadVoices, batchMapping, 
    setSpeakerMapping, generateBatchTTS, isGenerating: isStoreGenerating 
  } = useVoiceoverStore();
  
  const { subtitles, updateSubtitle, restoreSubtitles } = useSubtitleStore();
  
  const { 
    sourceResources, applySmartDubTrack, restoreOriginalVocals, originalVocalsUrl 
  } = useProjectStore();

  const [activeMode, setActiveMode] = useState<BatchMode>('standard');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [expandedSpeakers, setExpandedSpeakers] = useState<Set<string>>(new Set());
  const [isLocalGenerating, setIsLocalGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState(''); 
  
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [editorContent, setEditorContent] = useState('');
  
  const srtCacheRef = useRef<Map<string, string> | null>(null);
  // 缓存完整的原声字幕对象，而不仅仅是文本 Map
  const originalSubtitlesRef = useRef<SubtitleItem[]>([]);

  const isBusy = isStoreGenerating || isLocalGenerating;

  useEffect(() => { loadVoices(); }, []);

  // 加载原声字幕
  useEffect(() => {
    if (sourceResources?.originalSubtitleUrl && originalSubtitlesRef.current.length === 0) {
      fetch(sourceResources.originalSubtitleUrl)
        .then(r => r.text())
        .then(text => {
             // 解析并保存完整的原声字幕结构
             const parsed = parseSRT(text);
             originalSubtitlesRef.current = parsed;
             
             // 同时更新 Map 缓存 (为了兼容旧的 TTS 查找逻辑)
             const map = new Map<string, string>();
             parsed.forEach(ps => {
                 const key = `${(ps.startTime/1000).toFixed(1)}-${(ps.endTime/1000).toFixed(1)}`;
                 // 注意：这里 Map 的 value 最好是纯文本，不带 Speaker 标签，方便 TTS 使用
                 map.set(key, ps.text);
             });
             srtCacheRef.current = map;
        })
        .catch(e => console.warn("[Batch] 原声加载失败", e));
    }
  }, [sourceResources?.originalSubtitleUrl]);

  const groupedSubtitles = useMemo(() => {
    const groups: Record<string, SubtitleItem[]> = {};
    subtitles.forEach(s => {
      const speaker = s.speaker && s.speaker.trim() ? s.speaker : '未标记角色';
      if (!groups[speaker]) groups[speaker] = [];
      groups[speaker].push(s);
    });
    return groups;
  }, [subtitles]);

  const speakers = Object.keys(groupedSubtitles);

  // --- 通用交互 ---
  const toggleExpand = (speaker: string) => {
    const newExpanded = new Set(expandedSpeakers);
    if (newExpanded.has(speaker)) newExpanded.delete(speaker);
    else newExpanded.add(speaker);
    setExpandedSpeakers(newExpanded);
  };

  const toggleSubtitleCheck = (id: string) => {
    const newChecked = new Set(checkedIds);
    if (newChecked.has(id)) newChecked.delete(id);
    else newChecked.add(id);
    setCheckedIds(newChecked);
  };

  const toggleSpeakerGroupCheck = (speaker: string) => {
    const subs = groupedSubtitles[speaker];
    const allIds = subs.map(s => s.id);
    const isAllChecked = allIds.every(id => checkedIds.has(id));
    const newChecked = new Set(checkedIds);
    if (isAllChecked) allIds.forEach(id => newChecked.delete(id));
    else allIds.forEach(id => newChecked.add(id));
    setCheckedIds(newChecked);
  };

  const handleVoiceChange = (speaker: string, voiceId: string, type: 'system' | 'custom', name: string) => {
    setSpeakerMapping(speaker, { characterId: voiceId, name, type });
    const subs = groupedSubtitles[speaker];
    const newChecked = new Set(checkedIds);
    subs.forEach(s => newChecked.add(s.id));
    setCheckedIds(newChecked);
    setExpandedSpeakers(prev => new Set(prev).add(speaker));
  };

  // --- 编辑器逻辑 (核心修改) ---

  // [修改] 将 SubtitleItem 转回带 Speaker 标签的 SRT 格式文本
  const subtitlesToSRT = (subs: SubtitleItem[]) => {
    return subs.map((s, index) => {
      const start = msToSRTTime(s.startTime);
      const end = msToSRTTime(s.endTime);
      // 如果有 speaker，加上 [Speaker X] 前缀
      const content = s.speaker ? `[${s.speaker}] ${s.text}` : s.text;
      return `${index + 1}\n${start} --> ${end}\n${content}\n`;
    }).join('\n');
  };

  const openEditor = (mode: 'original' | 'script') => {
    setEditorMode(mode);
    if (mode === 'original') {
      // 优先使用已加载的原声字幕，如果没有则用当前字幕填充
      const source = originalSubtitlesRef.current.length > 0 ? originalSubtitlesRef.current : subtitles;
      setEditorContent(subtitlesToSRT(source));
    } else {
      setEditorContent(subtitlesToSRT(subtitles));
    }
  };

  const saveEditorContent = () => {
    try {
      // parseSRT 内部已经支持解析 [Speaker X] 格式
      const parsed = parseSRT(editorContent);
      
      if (parsed.length === 0) {
        alert("内容为空或格式错误，无法保存");
        return;
      }

      if (editorMode === 'original') {
        // 保存原声：更新 Ref 和 Map
        originalSubtitlesRef.current = parsed;
        const map = new Map<string, string>();
        parsed.forEach(ps => {
            const key = `${(ps.startTime/1000).toFixed(1)}-${(ps.endTime/1000).toFixed(1)}`;
            map.set(key, ps.text); // Map 里存纯文本
        });
        srtCacheRef.current = map;
        alert(`原声字幕已更新，共 ${parsed.length} 条`);
      } else {
        // 保存新剧本：更新 Store
        // 尝试保留原有 ID 以维持状态
        const merged = parsed.map((p, i) => {
            const old = subtitles[i];
            return {
                ...p,
                id: old ? old.id : p.id,
                style: old ? old.style : p.style,
                position: old ? old.position : p.position,
                // audioTrack: undefined // 如果需要重置配音状态可以解开这行
            };
        });
        restoreSubtitles(merged);
        alert(`新剧本已更新，共 ${merged.length} 条`);
      }
      setEditorMode(null);
    } catch (e) {
      console.error(e);
      alert("解析失败，请检查 SRT 格式是否正确 (序号、时间轴、[Speaker]标签)");
    }
  };

  // --- 生成逻辑 ---

  const handleGenerate = async () => {
    const idsToProcess = Array.from(checkedIds);
    if (idsToProcess.length === 0) return;

    if (activeMode === 'standard') {
      generateBatchTTS(idsToProcess);
    } else {
      const audioUrl = sourceResources?.audioVocals || sourceResources?.video;
      if (!audioUrl) return;

      setIsLocalGenerating(true);
      setProgressMsg('正在准备资源...');
      
      const originalSubtitlesMap = srtCacheRef.current || new Map();

      try {
        for (let i = 0; i < idsToProcess.length; i++) {
          const id = idsToProcess[i];
          const sub = subtitles.find(s => s.id === id);
          if (!sub) continue;
          setProgressMsg(`正在处理 (${i + 1}/${idsToProcess.length})...`);
          try {
            const audioBlob = await sliceAudioFromUrl(audioUrl, sub.startTime, sub.endTime);
            const timeKey = `${sub.startTime.toFixed(1)}-${sub.endTime.toFixed(1)}`;
            const promptText = originalSubtitlesMap.get(timeKey) || "";
            const durationInSeconds = (sub.endTime - sub.startTime) / 1000; 
            const result = await ttsService.generateWithAudioPrompt(
              sub.text, audioBlob, promptText, 1.0, 1.0, durationInSeconds
            );
            if (result?.audio_id) {
                updateSubtitle(id, {
                    audioTrack: {
                        volume: 1.0, fadeIn: 0, fadeOut: 0,
                        track: {
                            id: result.audio_id,
                            name: `动态复刻-${id.slice(0,4)}`,
                            url: `/api/tts/download/${result.audio_id}`,
                            duration: sub.endTime - sub.startTime,
                            category: 'custom', volume: 1.0, fadeIn: 0, fadeOut: 0
                        }
                    }
                });
            }
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {}
        }
      } finally {
        setIsLocalGenerating(false);
        setProgressMsg('');
      }
    }
  };

  const handleSmartDubbing = async () => {
    const audioUrl = sourceResources?.video || sourceResources?.audioVocals;
    if (!audioUrl) return alert("错误：未找到视频或人声源文件");

    setIsLocalGenerating(true);
    setProgressMsg('正在生成全剧本配音...');

    try {
      // 这里的 originalMap 只是用于 fallback 查找，实际上 ttsService.generateSmartDubbing
      // 应该直接使用我们刚刚编辑好的 originalSubtitlesRef.current (如果它存在)
      // 但为了保持接口一致性，我们还是传 Map，但在 generateSmartDubbing 内部可以优化
      
      const originalMap = srtCacheRef.current || new Map();
      const result = await ttsService.generateSmartDubbing(subtitles, originalMap, audioUrl);

      if (result.success && result.audioUrl) {
        applySmartDubTrack(result.audioUrl);
        useProjectStore.getState().setIsPlaying(false);
        setCheckedIds(new Set());
      }
    } catch (err: any) {
      alert(`配音失败: ${err.message}`);
    } finally {
      setIsLocalGenerating(false);
      setProgressMsg('');
    }
  };

  // --- 渲染 ---

  const renderSmartDubView = () => {
    return (
      <div className="space-y-4">
        <div className="bg-bg-tertiary/30 p-4 rounded-xl border border-border-secondary text-center space-y-3">
           <div className="text-sm text-text-secondary leading-relaxed">
             请分别编辑 <span className="text-accent-purple font-bold">原声字幕</span> 和 <span className="text-emerald-500 font-bold">新剧本</span>。<br/>
             请保留 <code className="bg-black/20 px-1 rounded text-xs">[Speaker X]</code> 标签以确保角色对齐。
           </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={() => openEditor('original')}
            className="flex items-center justify-between p-4 bg-bg-primary border border-border-secondary hover:border-accent-purple/50 rounded-xl group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-text-tertiary/10 rounded-lg text-text-tertiary group-hover:text-accent-purple transition-colors">
                <FileType size={20} />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-text-primary">编辑原声字幕文件 (SRT)</div>
                <div className="text-xs text-text-tertiary">修正 ASR 识别错误，作为 Prompt 参考</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-text-tertiary" />
          </button>

          <button 
            onClick={() => openEditor('script')}
            className="flex items-center justify-between p-4 bg-bg-primary border border-border-secondary hover:border-emerald-500/50 rounded-xl group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                <AlignLeft size={20} />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-text-primary">编辑新剧本文件 (SRT)</div>
                <div className="text-xs text-text-tertiary">修改台词或粘贴新剧本，作为配音内容</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-text-tertiary" />
          </button>
        </div>
      </div>
    );
  };

  const renderSubtitleList = () => {
    if (speakers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-40 text-text-tertiary gap-3">
           <AlertCircle size={24} /> <p className="text-sm">暂无字幕数据</p>
        </div>
      );
    }
    return speakers.map((speaker) => {
      const groupSubs = groupedSubtitles[speaker];
      const mapping = batchMapping[speaker];
      const isExpanded = expandedSpeakers.has(speaker);
      const checkedCount = groupSubs.filter(s => checkedIds.has(s.id)).length;
      const isAllChecked = checkedCount === groupSubs.length && groupSubs.length > 0;
      const isIndeterminate = checkedCount > 0 && checkedCount < groupSubs.length;

      return (
        <div key={speaker} className="bg-bg-primary rounded-lg border border-border-secondary overflow-hidden shadow-sm">
          <div className="p-3 bg-bg-tertiary border-b border-border-secondary flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer select-none hover:text-accent-purple transition-colors" onClick={() => toggleExpand(speaker)}>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="font-bold text-text-primary text-sm">{speaker}</span>
                <span className="text-xs text-text-tertiary">({groupSubs.length})</span>
              </div>
              <button onClick={() => toggleSpeakerGroupCheck(speaker)} className={`transition-colors ${isAllChecked || isIndeterminate ? 'text-accent-purple' : 'text-text-tertiary hover:text-text-secondary'}`}>
                {isAllChecked ? <CheckSquare size={18} /> : (isIndeterminate ? <div className="relative"><Square size={18} /><div className="absolute inset-0 flex items-center justify-center"><div className="w-2 h-2 bg-current rounded-sm"/></div></div> : <Square size={18} />)}
              </button>
            </div>
            {activeMode === 'standard' ? (
              <div className="relative">
                <select
                  className={`w-full p-2 pl-8 rounded-lg border text-sm outline-none appearance-none cursor-pointer transition-all ${mapping?.characterId ? 'bg-accent-purple/10 border-accent-purple/30 text-text-primary font-medium' : 'bg-bg-primary border-border-secondary text-text-secondary'}`}
                  value={mapping?.characterId || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (!selectedId) return;
                    const sysChar = systemCharacters.find(c => (c.id || (c as any).character_id) === selectedId);
                    const userVoice = userVoices.find(v => v.voice_id === selectedId);
                    if (sysChar) handleVoiceChange(speaker, sysChar.id || (sysChar as any).character_id, 'system', sysChar.name);
                    else if (userVoice) handleVoiceChange(speaker, userVoice.voice_id, 'custom', userVoice.voice_name);
                  }}
                >
                  <option value="" className="bg-bg-primary text-text-primary">-- 点击指派配音角色 --</option>
                  <optgroup label="系统预设角色" className="bg-bg-primary text-text-primary">
                    {systemCharacters.map(c => (
                      <option key={c.id || (c as any).character_id} value={c.id || (c as any).character_id} className="bg-bg-primary text-text-primary">{c.name} ({c.gender === 'female' ? '女' : '男'})</option>
                    ))}
                  </optgroup>
                  <optgroup label="我的克隆音色" className="bg-bg-primary text-text-primary">
                    {userVoices.map(v => (<option key={v.voice_id} value={v.voice_id} className="bg-bg-primary text-text-primary">{v.voice_name}</option>))}
                  </optgroup>
                </select>
                <Mic size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-accent-purple/5 border border-accent-purple/10 rounded-lg text-xs text-accent-purple">
                <Sparkles size={14} /> <span className="font-medium">将自动使用该角色在原视频中的声音片段</span>
              </div>
            )}
          </div>
          {isExpanded && (
            <div className="divide-y divide-border-secondary bg-bg-secondary/30">
              {groupSubs.map(sub => {
                const isChecked = checkedIds.has(sub.id);
                return (
                  <div key={sub.id} className={`flex items-start gap-3 p-3 transition-colors cursor-pointer group ${isChecked ? 'bg-accent-purple/5' : 'hover:bg-bg-tertiary'}`} onClick={() => toggleSubtitleCheck(sub.id)}>
                    <div className={`mt-0.5 flex-shrink-0 ${isChecked ? 'text-accent-purple' : 'text-text-tertiary group-hover:text-text-secondary'}`}>
                      {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-relaxed ${isChecked ? 'text-text-primary' : 'text-text-secondary'}`}>{sub.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-text-tertiary font-mono bg-bg-tertiary px-1 rounded border border-border-secondary">{(sub.startTime / 1000).toFixed(2)}s - {(sub.endTime / 1000).toFixed(2)}s</span>
                          {activeMode === 'dynamic' && (<span className="flex items-center gap-1 text-[10px] text-accent-purple/70 bg-accent-purple/5 px-1 rounded border border-accent-purple/10"><Activity size={8} /> 原声参考</span>)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-bg-secondary relative">
      <div className="p-4 border-b border-border-secondary bg-bg-primary space-y-3">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2"><Users size={20} /> 批量配音任务</h3>
        <div className="flex w-full bg-bg-tertiary p-1.5 rounded-lg border border-border-secondary gap-2">
          {['standard', 'dynamic', 'smart_dub'].map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode as BatchMode)}
              className={`flex-1 py-1.5 px-1 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeMode === mode ? 'bg-bg-primary text-accent-purple shadow-sm border border-border-secondary/50' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
            >
              {mode === 'standard' ? <Mic size={13} /> : mode === 'dynamic' ? <Sparkles size={13} /> : <FileAudio size={13} />}
              <span>{mode === 'standard' ? '普通配音' : mode === 'dynamic' ? '动态复刻' : '一键新剧本'}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-text-secondary flex justify-between items-center">
            <span>共 {subtitles.length} 条字幕{activeMode !== 'smart_dub' && `，${speakers.length} 个角色组`}</span>
            {activeMode === 'dynamic' && <span className="text-accent-purple">✨ 逐句还原语气</span>}
            {activeMode === 'smart_dub' && <span className="text-emerald-500">🚀 全剧本整体替换</span>}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeMode === 'smart_dub' ? renderSmartDubView() : renderSubtitleList()}
      </div>

      <div className="p-4 border-t border-border-secondary bg-bg-primary z-10">
        {originalVocalsUrl && (
          <div className="mb-3 p-2 bg-emerald-900/20 border border-emerald-500/30 rounded-lg flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
             <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/> 智能配音音轨生效中
             </div>
             <button onClick={() => { restoreOriginalVocals(); useProjectStore.getState().setIsPlaying(false); }} className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded transition-colors border border-emerald-500/20">恢复原声</button>
          </div>
        )}
        <div className="flex justify-between items-center mb-3">
          {activeMode !== 'smart_dub' && <div className="text-xs text-text-secondary">已选 <span className="text-accent-purple font-bold text-sm mx-0.5">{checkedIds.size}</span> 条</div>}
           {checkedIds.size > 0 && <button onClick={() => setCheckedIds(new Set())} className="text-xs text-text-tertiary hover:text-text-primary flex items-center gap-1"><Trash2 size={12} /> 清空选择</button>}
        </div>
        
         <button
          onClick={activeMode === 'smart_dub' ? handleSmartDubbing : handleGenerate}
          disabled={isBusy || (activeMode !== 'smart_dub' && checkedIds.size === 0)}
          className={`w-full py-3 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2 ${activeMode === 'dynamic' ? 'bg-gradient-to-r from-violet-600 to-indigo-600' : activeMode === 'smart_dub' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-500/20' : 'bg-accent-purple'} hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
        >
          {isBusy ? (<><Loader2 size={18} className="animate-spin" /><span>{progressMsg || (activeMode === 'smart_dub' ? '正在生成全剧本...' : '正在生成...')}</span></>) : (<>{activeMode === 'dynamic' ? <Sparkles size={18} /> : activeMode === 'smart_dub' ? <FileAudio size={18} /> : <Wand2 size={18} />}<span>{activeMode === 'dynamic' ? '开始原声复刻' : activeMode === 'smart_dub' ? '开始一键新剧本配音' : '开始生成'}</span></>)}
        </button>
      </div>

      {editorMode && (
        <div className="absolute inset-0 z-50 bg-bg-secondary flex flex-col animate-in slide-in-from-bottom-5">
          <div className="p-4 border-b border-border-secondary bg-bg-primary flex justify-between items-center shadow-sm">
            <h3 className="font-bold text-text-primary flex items-center gap-2">
              {editorMode === 'original' ? <FileType size={18} className="text-text-tertiary"/> : <AlignLeft size={18} className="text-emerald-500"/>}
              {editorMode === 'original' ? '编辑原声参考字幕' : '编辑新剧本台词'}
            </h3>
            <div className="flex gap-2">
              <button onClick={() => setEditorMode(null)} className="p-2 hover:bg-bg-tertiary rounded text-text-secondary"><X size={18} /></button>
              <button onClick={saveEditorContent} className="flex items-center gap-2 px-4 py-1.5 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-lg text-sm font-medium shadow-lg shadow-accent-purple/20"><Save size={16} /> 保存修改</button>
            </div>
          </div>
          <div className="flex-1 p-4 bg-bg-tertiary/50">
             <textarea 
               className="w-full h-full bg-bg-primary border border-border-secondary rounded-xl p-4 text-sm font-mono leading-relaxed text-text-primary focus:outline-none focus:border-accent-purple resize-none"
               value={editorContent}
               onChange={(e) => setEditorContent(e.target.value)}
               placeholder="1&#10;00:00:01,000 --> 00:00:05,000&#10;[Speaker 0] 请输入字幕内容..."
             />
          </div>
        </div>
      )}
    </div>
  );
}