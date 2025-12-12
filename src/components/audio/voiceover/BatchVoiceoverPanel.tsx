import { useEffect, useMemo, useState } from 'react';
import { useVoiceoverStore } from '@/stores/useVoiceoverStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { Loader2, Users, Wand2, ChevronDown, ChevronRight, CheckSquare, Square, AlertCircle, Mic, Trash2 } from 'lucide-react';
import { SubtitleItem } from '@/types/subtitle';

export function BatchVoiceoverPanel() {
  const { 
    systemCharacters, 
    userVoices, 
    loadVoices, 
    batchMapping, 
    setSpeakerMapping, 
    generateBatchTTS, 
    isGenerating 
  } = useVoiceoverStore();
  
  const { subtitles } = useSubtitleStore();

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [expandedSpeakers, setExpandedSpeakers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadVoices();
  }, []);

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

  const toggleExpand = (speaker: string) => {
    const newExpanded = new Set(expandedSpeakers);
    if (newExpanded.has(speaker)) {
      newExpanded.delete(speaker);
    } else {
      newExpanded.add(speaker);
    }
    setExpandedSpeakers(newExpanded);
  };

  const toggleSubtitleCheck = (id: string) => {
    const newChecked = new Set(checkedIds);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedIds(newChecked);
  };

  const toggleSpeakerGroupCheck = (speaker: string) => {
    const subs = groupedSubtitles[speaker];
    const allIds = subs.map(s => s.id);
    const isAllChecked = allIds.every(id => checkedIds.has(id));
    
    const newChecked = new Set(checkedIds);
    if (isAllChecked) {
      allIds.forEach(id => newChecked.delete(id));
    } else {
      allIds.forEach(id => newChecked.add(id));
    }
    setCheckedIds(newChecked);
  };

  const handleVoiceChange = (speaker: string, voiceId: string, type: 'system' | 'custom', name: string) => {
    setSpeakerMapping(speaker, { characterId: voiceId, name, type });
    
    const subs = groupedSubtitles[speaker];
    const newChecked = new Set(checkedIds);
    subs.forEach(s => newChecked.add(s.id));
    setCheckedIds(newChecked);
    
    const newExpanded = new Set(expandedSpeakers);
    newExpanded.add(speaker);
    setExpandedSpeakers(newExpanded);
  };

  const handleGenerate = () => {
    const idsToProcess = Array.from(checkedIds);
    if (idsToProcess.length === 0) return;
    generateBatchTTS(idsToProcess);
  };

  return (
    <div className="h-full flex flex-col bg-bg-secondary">
      <div className="p-4 border-b border-border-secondary bg-bg-primary">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Users size={20} />
          批量配音任务
        </h3>
        <p className="text-xs text-text-secondary mt-1">
          共 {subtitles.length} 条字幕，识别到 {speakers.length} 个角色组
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {speakers.length > 0 ? (
          speakers.map((speaker) => {
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
                    <div 
                      className="flex items-center gap-2 cursor-pointer select-none hover:text-accent-purple transition-colors" 
                      onClick={() => toggleExpand(speaker)}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="font-bold text-text-primary text-sm">{speaker}</span>
                      <span className="text-xs text-text-tertiary">({groupSubs.length})</span>
                    </div>
                    
                    <button 
                       onClick={() => toggleSpeakerGroupCheck(speaker)}
                       className={`transition-colors ${isAllChecked || isIndeterminate ? 'text-accent-purple' : 'text-text-tertiary hover:text-text-secondary'}`}
                    >
                      {isAllChecked ? <CheckSquare size={18} /> : (isIndeterminate ? <div className="relative"><Square size={18} /><div className="absolute inset-0 flex items-center justify-center"><div className="w-2 h-2 bg-current rounded-sm"/></div></div> : <Square size={18} />)}
                    </button>
                  </div>

                  <div className="relative">
                    <select
                      className={`
                        w-full p-2 pl-8 rounded-lg border text-sm outline-none appearance-none cursor-pointer transition-all
                        ${mapping?.characterId 
                          ? 'bg-accent-purple/10 border-accent-purple/30 text-text-primary font-medium' 
                          : 'bg-bg-primary border-border-secondary text-text-secondary'
                        }
                      `}
                      value={mapping?.characterId || ''}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (!selectedId) return;

                        const sysChar = systemCharacters.find(c => {
                            const cId = c.id || (c as any).character_id;
                            return cId === selectedId;
                        });

                        const userVoice = userVoices.find(v => v.voice_id === selectedId);
                        
                        if (sysChar) {
                          const sysId = sysChar.id || (sysChar as any).character_id;
                          handleVoiceChange(speaker, sysId, 'system', sysChar.name);
                        } else if (userVoice) {
                          handleVoiceChange(speaker, userVoice.voice_id, 'custom', userVoice.voice_name);
                        }
                      }}
                    >
                      <option value="">-- 点击指派配音角色 --</option>
                      <optgroup label="系统预设角色">
                        {systemCharacters.map(c => {
                           const cId = c.id || (c as any).character_id;
                           return <option key={cId} value={cId}>{c.name} ({c.gender === 'female' ? '女' : '男'})</option>;
                        })}
                      </optgroup>
                      <optgroup label="我的克隆音色">
                        {userVoices.map(v => (
                          <option key={v.voice_id} value={v.voice_id}>{v.voice_name}</option>
                        ))}
                      </optgroup>
                    </select>
                    <Mic size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                  </div>
                </div>

                {isExpanded && (
                  <div className="divide-y divide-border-secondary bg-bg-secondary/30">
                    {groupSubs.map(sub => {
                      const isChecked = checkedIds.has(sub.id);
                      return (
                        <div 
                          key={sub.id} 
                          className={`
                            flex items-start gap-3 p-3 transition-colors cursor-pointer group
                            ${isChecked ? 'bg-accent-purple/5' : 'hover:bg-bg-tertiary'}
                          `}
                          onClick={() => toggleSubtitleCheck(sub.id)}
                        >
                          <div className={`mt-0.5 flex-shrink-0 ${isChecked ? 'text-accent-purple' : 'text-text-tertiary group-hover:text-text-secondary'}`}>
                            {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-relaxed ${isChecked ? 'text-text-primary' : 'text-text-secondary'}`}>
                              {sub.text}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-text-tertiary font-mono bg-bg-tertiary px-1 rounded border border-border-secondary">
                                    {(sub.startTime / 1000).toFixed(2)}s - {(sub.endTime / 1000).toFixed(2)}s
                                </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-text-tertiary gap-3">
             <AlertCircle size={24} />
             <p className="text-sm">暂无字幕数据</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border-secondary bg-bg-primary z-10">
        <div className="flex justify-between items-center mb-3">
           <div className="text-xs text-text-secondary">
             已选 <span className="text-accent-purple font-bold text-sm mx-0.5">{checkedIds.size}</span> 条
           </div>
           {checkedIds.size > 0 && (
             <button 
               onClick={() => setCheckedIds(new Set())}
               className="text-xs text-text-tertiary hover:text-text-primary flex items-center gap-1"
             >
               <Trash2 size={12} />
               清空选择
             </button>
           )}
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={isGenerating || checkedIds.size === 0}
          className="
            w-full py-3 rounded-xl bg-accent-purple text-white font-medium transition-all
            hover:bg-accent-purple/90 hover:shadow-lg hover:shadow-accent-purple/20 
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
            flex items-center justify-center gap-2
          "
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>正在批量生成...</span>
            </>
          ) : (
            <>
              <Wand2 size={18} />
              <span>开始生成</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}