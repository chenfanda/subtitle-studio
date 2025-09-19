import { VideoPlayer } from '../video/VideoPlayer';
import { SubtitleOverlay } from '../video/SubtitleOverlay';
import { VideoControls } from '../video/VideoControls';
import { Watermark } from '../common/Watermark';
import { useProjectStore } from '../../stores/useProjectStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

export function VideoArea() {
  const { videoUrl, appStage } = useProjectStore();
  const { watermark } = useSettingsStore();

  if (appStage !== 'editing' || !videoUrl) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">🎬</div>
          <div className="text-xl">Video not ready</div>
          <div className="text-sm mt-2">Please wait for video processing</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* 视频显示区域 - 使用flex-1占用除控制栏外的所有空间 */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-0">
        <div 
          className="relative w-full" 
          style={{ 
            aspectRatio: '16/9',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          {/* 视频播放器 */}
          <VideoPlayer />
          
          {/* 字幕叠加层 */}
          <SubtitleOverlay />
          
          {/* 可配置水印 */}
          <Watermark config={watermark} />
        </div>
      </div>
      
      {/* 视频控制栏 - 固定80px高度，添加明显的视觉分隔 */}
      <div className="h-20 bg-gray-800 flex-shrink-0 border-t-2 border-gray-600">
        <VideoControls />
      </div>
    </div>
  );
}