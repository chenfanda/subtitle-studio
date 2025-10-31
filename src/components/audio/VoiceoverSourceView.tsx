import { useState } from 'react';
import { useVoiceoverStore } from '@/stores/useVoiceoverStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import type { VoiceoverSourceView } from '@/stores/useVoiceoverStore';
import type { SubtitleItem } from '@/types/subtitle';

// 这是一个内部的 TTS 面板组件
function TTSPanel({ targetSubtitleId }: { targetSubtitleId: string }) {
  const { generateTTS, isGenerating } = useVoiceoverStore();
  const subtitle = useSubtitleStore(state => 
    state.subtitles.find(s => s.id === targetSubtitleId)
  );

  const [text, setText] = useState(subtitle?.text || '');

  const handleGenerate = () => {
    if (!subtitle) return;
    const subtitleWithText = { ...subtitle, text: text };
    generateTTS(subtitleWithText);
  };

  return (
    <div className="p-4 space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        className="
          w-full p-2 bg-bg-tertiary border border-border-secondary rounded-lg
          text-text-primary placeholder-text-tertiary focus:outline-none 
          focus:border-accent-purple transition-colors
        "
        placeholder="输入要生成的文本..."
      />
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !text.trim()}
        className="
          w-full py-3 rounded-lg bg-accent-purple hover:bg-accent-purple/90 
          text-white font-medium transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isGenerating ? '生成中...' : '生成配音'}
      </button>
    </div>
  );
}

// 这是一个占位符
function LibraryPanel() {
  return <div className="p-4 text-text-secondary">音频库功能待实现</div>;
}

// 这是一个占位符
function UploadPanel() {
  return <div className="p-4 text-text-secondary">上传功能待实现</div>;
}


interface VoiceoverSourceViewProps {
  targetSubtitleId: string;
}

export function VoiceoverSourceView({ targetSubtitleId }: VoiceoverSourceViewProps) {
  const { sourceView, setSourceView } = useVoiceoverStore();

  const tabs: { id: VoiceoverSourceView; name: string }[] = [
    { id: 'tts', name: 'TTS 生成' },
    { id: 'library', name: '音频库' },
    { id: 'upload', name: '本地上传' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border-secondary px-4 pt-4">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSourceView(tab.id)}
              className={`
                pb-2 border-b-2 transition-colors text-sm font-medium
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

      <div className="flex-1 overflow-y-auto">
        {sourceView === 'tts' && <TTSPanel targetSubtitleId={targetSubtitleId} />}
        {sourceView === 'library' && <LibraryPanel />}
        {sourceView === 'upload' && <UploadPanel />}
      </div>
    </div>
  );
}