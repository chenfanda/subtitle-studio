import { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { parseSRT } from '@/utils/subtitleParser';

export function ProcessingStage() {
  const { setAppStage } = useProjectStore();
  const { updateSubtitles } = useSubtitleStore();
  const [status, setStatus] = useState('正在分析视频...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const simulateProcessing = async () => {
      try {
        setStatus('正在分析视频内容...');
        setProgress(20);
        await delay(1000);

        setStatus('正在生成字幕...');
        setProgress(40);
        await delay(1000);

        setStatus('正在读取字幕文件...');
        setProgress(60);
        
        const subtitles = await loadLocalSubtitles();
        
        setProgress(80);
        setStatus('正在处理字幕数据...');
        await delay(500);

        updateSubtitles(subtitles);
        
        setProgress(100);
        setStatus('处理完成！');
        await delay(500);

        setAppStage('editing');
        
      } catch (error) {
        console.error('字幕处理失败:', error);
        setStatus('处理失败，使用默认字幕');
        
        updateSubtitles([]);
        await delay(1000);
        setAppStage('editing');
      }
    };

    simulateProcessing();
  }, [setAppStage, updateSubtitles]);

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-8">
          <div className="animate-spin">⚙️</div>
        </div>
        
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          AI 正在处理视频
        </h2>
        
        <p className="text-text-secondary mb-6">{status}</p>
        
        <div className="w-full bg-bg-tertiary rounded-full h-2 mb-4">
          <div 
            className="bg-accent-purple h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-sm text-text-tertiary">
          {progress}% 完成
        </div>
      </div>
    </div>
  );
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const loadLocalSubtitles = async () => {
  try {
    const response = await fetch('/test-data/sample-with-speakers.srt');
    
    if (!response.ok) {
      throw new Error('字幕文件不存在');
    }
    
    const srtContent = await response.text();
    const subtitles = parseSRT(srtContent);
    
    console.log(`成功加载 ${subtitles.length} 条字幕`);
    return subtitles;
    
  } catch (error) {
    console.error('读取本地字幕失败:', error);
    return [];
  }
};