import { useMemo } from 'react';
import { VideoPlayer } from '../video/VideoPlayer';
import { SubtitleOverlay } from '../video/SubtitleOverlay';
import { TextElementOverlay } from '../video/TextElementOverlay';
import { MediaOverlay } from '../video/MediaOverlay';
import { VideoControls } from '../video/VideoControls';
import { Watermark } from '../common/Watermark';
import { BrollVideoPlayer } from '../broll/BrollVideoPlayer';
import { useProjectStore } from '../../stores/useProjectStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

export function VideoArea() {
  const { videoUrl, appStage, subtitles, currentTime } = useProjectStore();
  const { watermark } = useSettingsStore();

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
          className="relative w-full video-container" 
          style={{ 
            aspectRatio: '16/9',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          <div 
            className="absolute inset-0"
            style={{ 
              opacity: hasBroll ? 0 : 1, 
              transition: 'opacity 0.3s',
              pointerEvents: hasBroll ? 'none' : 'auto'
            }}
          >
            <VideoPlayer />
          </div>
          
          {hasBroll && currentSubtitle?.brollVideo && (
            <BrollVideoPlayer 
              brollData={currentSubtitle.brollVideo}
              subtitle={currentSubtitle}
            />
          )}
          
          <SubtitleOverlay />
          
          <TextElementOverlay />
          
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