import { useMemo } from 'react';
import { VideoPlayer } from '../video/VideoPlayer';
import { SubtitleOverlay } from '../video/SubtitleOverlay';
import { MediaOverlay } from '../video/MediaOverlay';
import { VideoControls } from '../video/VideoControls';
import { Watermark } from '../common/Watermark';
import { BrollVideoPlayer } from '../broll/BrollVideoPlayer';
import { useProjectStore } from '../../stores/useProjectStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

export function VideoArea() {
  const { videoUrl, appStage, subtitles, currentTime } = useProjectStore();
  const { watermark } = useSettingsStore();

  // 检测当前时间的字幕及其B-roll
  const currentSubtitle = useMemo(() => {
    const currentTimeMs = currentTime * 1000;
    return subtitles.find(s => 
      currentTimeMs >= s.startTime && currentTimeMs <= s.endTime
    );
  }, [subtitles, currentTime]);

  const hasBroll = !!currentSubtitle?.brollVideo;

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
      <div className="flex-1 flex items-center justify-center p-6 min-h-0">
        <div 
          className="relative w-full" 
          style={{ 
            aspectRatio: '16/9',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          {/* 主视频播放器 - 有B-roll时隐藏 */}
          <div 
            className="absolute inset-0"
            style={{ 
              opacity: hasBroll ? 0 : 1, 
              transition: 'opacity 0.3s',
              pointerEvents: hasBroll ? 'none' : 'auto'  // ✅ 关键修复：有B-roll时禁用交互
            }}
          >
            <VideoPlayer />
          </div>
          
          {/* B-roll视频播放器 - 有B-roll时显示 */}
          {hasBroll && currentSubtitle?.brollVideo && (
            <BrollVideoPlayer 
              brollData={currentSubtitle.brollVideo}
              subtitle={currentSubtitle}
            />
          )}
          
          {/* 字幕叠加层 - 始终显示 */}
          <SubtitleOverlay />
          
          {/* 媒体叠加层 - 始终显示 */}
          <MediaOverlay />
          
          <Watermark config={watermark} />
        </div>
      </div>
      
      <div className="h-20 bg-gray-800 flex-shrink-0 border-t-2 border-gray-600">
        <VideoControls />
      </div>
    </div>
  );
}