import { useState } from 'react';
import { useVoiceoverStore } from '@/stores/useVoiceoverStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { VoiceoverUploadPanel } from './VoiceoverUploadPanel';
import { useUserStore } from '@/stores/useUserStore';
import { Loader2, Mic } from 'lucide-react';
// 引入拆分出去的 TTSPanel 组件
import { TTSPanel } from './TTSPanel';

// --- 子组件：原声提取面板 ---
function ExtractionPanel({ targetSubtitleId }: { targetSubtitleId: string }) {
  const { extractAudioFromSubtitle, isGenerating } = useVoiceoverStore();
  const subtitle = useSubtitleStore(state => state.subtitles.find(s => s.id === targetSubtitleId));
  const [voiceName, setVoiceName] = useState('');
  const isLoggedIn = useUserStore(state => state.isLoggedIn);

  const handleExtract = () => {
    if (!subtitle) return;
    extractAudioFromSubtitle(subtitle, voiceName.trim() || undefined);
  };

  if (!subtitle) return null;

  return (
    <div className="p-6 flex flex-col h-full items-center justify-center text-center space-y-6">
      <div className="w-24 h-24 rounded-full bg-accent-purple/5 border border-accent-purple/20 flex items-center justify-center text-accent-purple mb-2 animate-pulse">
        <Mic size={48} />
      </div>
      
      <div className="space-y-2 max-w-xs">
        <h3 className="text-lg font-semibold text-text-primary">提取当前片段原声</h3>
        <p className="text-sm text-text-secondary">
          系统将截取 <strong>{formatTime(subtitle.startTime)} - {formatTime(subtitle.endTime)}</strong> 的人声片段，并保存为您的专属音色。
        </p>
      </div>

      <div className="w-full max-w-sm bg-bg-tertiary p-4 rounded-xl border border-border-secondary text-left space-y-4 shadow-sm">
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1.5 block">音色名称</label>
          <input
            type="text"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            placeholder={subtitle.speaker ? `建议命名: ${subtitle.speaker}` : "给这个声音起个名字..."}
            className="w-full p-2.5 bg-bg-primary border border-border-secondary rounded-lg text-sm focus:border-accent-purple outline-none transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1.5 block">参考文本</label>
          <div className="p-2.5 bg-bg-primary border border-border-secondary rounded-lg text-sm text-text-primary italic opacity-80">
            "{subtitle.text}"
          </div>
        </div>
      </div>

      <button
        onClick={handleExtract}
        disabled={isGenerating || !isLoggedIn}
        className="w-full max-w-sm py-3 rounded-lg bg-accent-purple hover:bg-accent-purple/90 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? <Loader2 className="animate-spin" /> : <Mic />}
        {isLoggedIn ? "确认提取并保存" : "请先登录"}
      </button>
    </div>
  );
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}:${rs.toString().padStart(2, '0')}`;
}

function LibraryPanel() {
  return <div className="h-full flex items-center justify-center text-text-secondary">音频库功能开发中...</div>;
}

interface VoiceoverSourceViewProps {
  targetSubtitleId: string;
}

// --- 主视图 ---
export function VoiceoverSourceView({ targetSubtitleId }: VoiceoverSourceViewProps) {
  const { sourceView, setSourceView } = useVoiceoverStore();

  const tabs = [
    { id: 'tts', name: 'TTS 生成' },
    { id: 'extraction', name: '原声提取' },
    { id: 'library', name: '音频库' },
    { id: 'upload', name: '上传' },
  ] as const;

  return (
    <div className="h-full flex flex-col bg-bg-secondary">
      <div className="border-b border-border-secondary px-4 pt-4 bg-bg-primary">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSourceView(tab.id)}
              className={`
                pb-3 border-b-2 transition-colors text-sm font-medium px-1
                ${sourceView === tab.id
                  ? 'border-accent-purple text-accent-purple'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
                }
              `}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-bg-secondary">
        {sourceView === 'tts' && <TTSPanel targetSubtitleId={targetSubtitleId} />}
        {sourceView === 'extraction' && <ExtractionPanel targetSubtitleId={targetSubtitleId} />}
        {sourceView === 'library' && <LibraryPanel />}
        {sourceView === 'upload' && <VoiceoverUploadPanel />}
      </div>
    </div>
  );
}