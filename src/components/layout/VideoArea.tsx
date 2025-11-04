import { useMemo } from 'react';
import { VideoPlayer } from '../video/VideoPlayer';
import { SubtitleOverlay } from '../video/SubtitleOverlay';
import { TextElementOverlay } from '../video/TextElementOverlay';
import { MediaOverlay } from '../video/MediaOverlay';
import { Watermark } from '../common/Watermark';
import { BrollVideoPlayer } from '../broll/BrollVideoPlayer';
import { VoiceoverAudioPlayer } from '../audio/VoiceoverAudioPlayer';
import { useProjectStore } from '../../stores/useProjectStore';
import { useSubtitleStore } from '../../stores/useSubtitleStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useUIStore } from '../../stores/useUIStore';

export function VideoArea() {
  const { videoUrl, appStage, currentTime } = useProjectStore();
  const { subtitles } = useSubtitleStore();
  const { watermark } = useSettingsStore();
  const { 
    clearSelectedSubtitles, 
    clearSelectedTextElements, 
    clearVideoToolbar,
    setShowRichTextEditor,
    setEditingSubtitle,
    setEditingTextElement
  } = useUIStore();

  const currentSubtitle = useMemo(() => {
    const currentTimeMs = currentTime * 1000;
    return subtitles.find(s => 
      currentTimeMs >= s.startTime && currentTimeMs <= s.endTime
    );
  }, [subtitles, currentTime]);

  const hasBroll = !!currentSubtitle?.brollVideo;
  const hasAudioTrack = !!currentSubtitle?.audioTrack;

  const handleClickOutside = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      clearSelectedSubtitles();
      clearSelectedTextElements();
      clearVideoToolbar();
      setShowRichTextEditor(false);
      setEditingSubtitle(null);
      setEditingTextElement(null);
    }
  };

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
    <div className="h-full flex items-center justify-center p-6 bg-gray-900">
      <div 
        className="relative w-full video-container" 
        style={{ 
          aspectRatio: '16/9',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        onClick={handleClickOutside}
      >
        <div 
          className="absolute inset-0"
          style={{ 
            opacity: hasBroll ? 0 : 1, 
            transition: 'opacity 0.3s',
            pointerEvents: hasBroll ? 'none' : 'auto'
          }}
        >
          <VideoPlayer isMutedOverride={hasAudioTrack} />
        </div>
        
        {hasBroll && currentSubtitle?.brollVideo && (
          <BrollVideoPlayer 
            brollData={currentSubtitle.brollVideo}
            subtitle={currentSubtitle}
          />
        )}

        {hasAudioTrack && currentSubtitle?.audioTrack && (
          <VoiceoverAudioPlayer
            audioData={currentSubtitle.audioTrack}
            subtitle={currentSubtitle}
          />
        )}
        
        <SubtitleOverlay />
        
        <TextElementOverlay />
        
        <MediaOverlay />
        
        <Watermark config={watermark} />
      </div>
    </div>
  );
}