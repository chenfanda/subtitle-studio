import { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { parseSRT } from '@/utils/subtitleParser';

export function ProcessingStage() {
  const { setAppStage, updateSubtitles } = useProjectStore();
  const [status, setStatus] = useState('正在分析视频...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const simulateProcessing = async () => {
      try {
        // 模拟处理进度
        setStatus('正在分析视频内容...');
        setProgress(20);
        await delay(1000);

        setStatus('正在生成字幕...');
        setProgress(40);
        await delay(1000);

        setStatus('正在读取字幕文件...');
        setProgress(60);
        
        // 读取本地字幕文件
        const subtitles = await loadLocalSubtitles();
        
        setProgress(80);
        setStatus('正在处理字幕数据...');
        await delay(500);

        // 更新字幕数据
        updateSubtitles(subtitles);
        
        setProgress(100);
        setStatus('处理完成！');
        await delay(500);

        // 跳转到编辑页面
        setAppStage('editing');
        
      } catch (error) {
        console.error('字幕处理失败:', error);
        setStatus('处理失败，使用默认字幕');
        
        // 失败时使用空字幕，允许用户手动添加
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
        {/* 处理动画 */}
        <div className="text-6xl mb-8">
          <div className="animate-spin">⚙️</div>
        </div>
        
        {/* 状态文本 */}
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          AI 正在处理视频
        </h2>
        
        <p className="text-text-secondary mb-6">{status}</p>
        
        {/* 进度条 */}
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

// 工具函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 读取本地字幕文件
const loadLocalSubtitles = async () => {
  try {
    // 从 public 目录读取字幕文件
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
    
    // 如果本地文件不存在，返回空数组
    return [];
  }
};

// 后续切换到后端API时，只需要替换 loadLocalSubtitles 函数：
/*
const loadSubtitlesFromAPI = async (videoFile: File) => {
  const formData = new FormData();
  formData.append('video', videoFile);
  
  const response = await fetch('/api/generate-subtitles', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return parseSRT(result.srtContent);
};
*/