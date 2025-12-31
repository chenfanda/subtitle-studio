import { useMemo, useRef, useState, useEffect } from 'react';
import { VideoPlayer } from '../video/VideoPlayer';
import { SubtitleOverlay } from '../video/SubtitleOverlay';
import { TextElementOverlay } from '../video/TextElementOverlay';
import { MediaOverlay } from '../video/MediaOverlay';
import { Watermark } from '../common/Watermark';
import { MaskOverlay } from '../video/MaskOverlay'; 
import { BrollVideoPlayer } from '../broll/BrollVideoPlayer';
import { VoiceoverAudioPlayer } from '../audio/voiceover/VoiceoverAudioPlayer';
import { useProjectStore } from '../../stores/useProjectStore';
import { useSubtitleStore } from '../../stores/useSubtitleStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useUIStore } from '../../stores/useUIStore';
import { useVideoSourceSwitcher } from '../../hooks/useVideoSourceSwitcher';

export function VideoArea() {
  const { videoUrl, appStage, currentTime, videoMeta } = useProjectStore();
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

  const { isInsertClip } = useVideoSourceSwitcher();

  const currentSubtitle = useMemo(() => {
    if (isInsertClip) return undefined;
    const currentTimeMs = currentTime * 1000;
    return subtitles.find(s => 
      currentTimeMs >= s.startTime && currentTimeMs <= s.endTime
    );
  }, [subtitles, currentTime, isInsertClip]);

  const hasBroll = !!currentSubtitle?.brollVideo;
  const hasAudioTrack = !!currentSubtitle?.audioTrack;
  const shouldMuteVideoPlayer = hasBroll || hasAudioTrack;

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

  const setEditorHeight = useProjectStore((state) => state.setEditorHeight);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // 新增：用于存储计算后的精确像素尺寸
  const [containerStyle, setContainerStyle] = useState({ width: '100%', height: '100%' });
  const [scaleFactor, setScaleFactor] = useState(1);

  // 核心逻辑：JS 强制计算尺寸
  useEffect(() => {
    if (!wrapperRef.current) return;
    
    const calculateSize = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      
      const wrapperW = wrapper.clientWidth;
      const wrapperH = wrapper.clientHeight;
      const aspect = videoMeta.width / videoMeta.height;
      
      // 算法：contain 逻辑
      // 1. 试着以宽度为基准
      let w = wrapperW;
      let h = w / aspect;
      
      // 2. 如果算出来的高度超出了父级高度，那就改以高度为基准
      if (h > wrapperH) {
        h = wrapperH;
        w = h * aspect;
      }
      const currentScale = h / videoMeta.height;
      setScaleFactor(currentScale);
      // 3. 设置精确像素值
      setContainerStyle({
        width: `${w}px`,
        height: `${h}px`
      });
      
      // 同步给 store (保留原有逻辑)
      setEditorHeight(h);
    };

    // 初始化计算
    calculateSize();
    
    // 监听窗口或父容器变化
    const observer = new ResizeObserver(calculateSize);
    observer.observe(wrapperRef.current);
    
    return () => observer.disconnect();
  }, [videoMeta.width, videoMeta.height, setEditorHeight]);

  if (appStage !== 'editing' || !videoUrl) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">🎬</div>
          <div className="text-xl">Video not ready</div>
        </div>
      </div>
    );
  }

  return (
    // 外层 Wrapper：负责提供最大可用空间
    <div 
      ref={wrapperRef} 
      className="w-full h-full flex items-center justify-center bg-gray-900 overflow-hidden p-6"
    >
      {/* 中间层：由 JS 精确控制尺寸，绝对不会塌缩，绝对没有黑边 */}
      <div 
        style={{
          ...containerStyle,
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* 内层：视频容器 */}
        <div 
          ref={containerRef}
          className="relative w-full h-full video-container bg-black"
          onClick={handleClickOutside}
        >
          {/* 这里的 VideoPlayer 请务必用 objectFit: 'contain' */}
          {/* 因为外层容器已经严格等于视频比例了，contain 就会完美铺满 */}
          <div 
            className="absolute inset-0"
            style={{ 
              opacity: hasBroll ? 0 : 1, 
              transition: 'opacity 0.3s',
              pointerEvents: hasBroll ? 'none' : 'auto'
            }}
          >
            <VideoPlayer isMutedOverride={shouldMuteVideoPlayer} />
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

          {!isInsertClip && <MaskOverlay />}
          <SubtitleOverlay />
          <TextElementOverlay />
          <MediaOverlay />
          <Watermark config={watermark} scaleFactor={scaleFactor}/>
        </div>
      </div>
    </div>
  );
}