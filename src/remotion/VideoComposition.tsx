import React, { useMemo } from 'react';
import { AbsoluteFill, Sequence, Audio, useVideoConfig, OffthreadVideo } from 'remotion';
import type { ProjectExport } from '@/types/project';
import type { TimelineSegment } from '@/types/videoSequence';
import { TimeWarpMap } from './utils/timeWarp';

import { RenderSubtitle } from './components/RenderSubtitle';
import { RenderTextElement } from './components/RenderTextElement';
import { RenderBroll } from './components/RenderBroll';
import { RenderMedia } from './components/RenderMedia';
import { RenderWatermark } from './components/RenderWatermark';
import { RenderMask } from './components/RenderMask';

export interface VideoCompositionProps {
  // [修改] 扩展类型，接收预渲染的底板 URL
  project: ProjectExport & { preRenderedVideoUrl?: string };
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({ project }) => {
  const { fps, height, durationInFrames } = useVideoConfig();
  // [修改] 解构出 preRenderedVideoUrl
  const { content, settings, video, preRenderedVideoUrl } = project;

  const referenceHeight = settings.referenceHeight || 540;
  const scaleFactor = height / referenceHeight;

  const hasSeparatedTracks = !!(content.sourceResources?.audioVocals && content.sourceResources?.audioBacking);

  // ---------------------------------------------------------------------------
  // 1. 音量表计算 (优化)
  // ---------------------------------------------------------------------------
  const { timeWarper, backingVolumeMap, vocalVolumeMap } = useMemo(() => {
    // [新增] 如果有底板，说明音频已由 FFmpeg 混合，无需计算音量表
    if (preRenderedVideoUrl) {
       const mapper = new TimeWarpMap();
       mapper.build(content.videoSequenceSegments || []);
       return { 
         timeWarper: mapper, 
         backingVolumeMap: new Float32Array(0), 
         vocalVolumeMap: new Float32Array(0) 
       };
    }

    // ... 原有逻辑保持不变 (用于本地/前端模式) ...
    const mapper = new TimeWarpMap();
    mapper.build(content.videoSequenceSegments || []);
    const backingMap = new Float32Array(durationInFrames).fill(1);
    const vocalMap = new Float32Array(durationInFrames).fill(1);

    if (!content.subtitles) {
      return { timeWarper: mapper, backingVolumeMap: backingMap, vocalVolumeMap: vocalMap };
    }

    content.subtitles.forEach((sub) => {
      if (!sub.sourceMix) return;
      const globalStartMs = mapper.getNewTime(sub.startTime);
      const globalEndMs = mapper.getNewTime(sub.endTime);
      const startFrame = Math.round((globalStartMs / 1000) * fps);
      const endFrame = Math.round((globalEndMs / 1000) * fps);
      const safeStart = Math.max(0, startFrame);
      const safeEnd = Math.min(durationInFrames, endFrame);
      const backingVol = sub.sourceMix.backingVolume ?? 1;
      const vocalVol = sub.sourceMix.originalVocalVolume ?? 1;
      for (let i = safeStart; i < safeEnd; i++) {
        backingMap[i] = backingVol;
        vocalMap[i] = vocalVol;
      }
    });

    return { timeWarper: mapper, backingVolumeMap: backingMap, vocalVolumeMap: vocalMap };
  }, [content.subtitles, content.videoSequenceSegments, durationInFrames, fps, preRenderedVideoUrl]);

  // 辅助函数
  const getAdjustedFrame = (ms: number) => {
    const newTime = timeWarper.getNewTime(ms);
    return Math.round((newTime / 1000) * fps);
  };
  const durationToFrames = (ms: number) => Math.round((ms / 1000) * fps);
  const rawMsToFrames = (ms: number) => Math.round((ms / 1000) * fps);

  // ===========================================================================
  // [分支 A] 预渲染模式 (云端 GPU 加速)
  // ===========================================================================
  if (preRenderedVideoUrl) {
    return (
      <AbsoluteFill style={{ backgroundColor: 'black' }}>
        {/* 1. 底板视频 */}
        {/* 包含：剪辑片段、Mask(马赛克)、所有音频、普通 B-Roll、水印(如果在FFmpeg加了) */}
        <OffthreadVideo
          src={preRenderedVideoUrl}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />

        {/* 2. 贴图素材 (图片层) */}
        {content.placedMedia?.map((item) => {
          const startFrame = getAdjustedFrame(item.position.startTime);
          const durationFrames = durationToFrames(item.position.endTime - item.position.startTime);
          if (durationFrames <= 0) return null;
          return (
            <Sequence key={item.id} from={startFrame} durationInFrames={durationFrames}>
              <RenderMedia item={item} scaleFactor={scaleFactor} />
            </Sequence>
          );
        })}

        {/* 3. 富文本字幕 (核心 UI 层) */}
        {content.subtitles?.map((sub) => {
          const startFrame = getAdjustedFrame(sub.startTime);
          const durationFrames = durationToFrames(sub.endTime - sub.startTime);
          if (durationFrames <= 0) return null;
          return (
            <Sequence key={sub.id} from={startFrame} durationInFrames={durationFrames}>
              <RenderSubtitle subtitle={sub} scaleFactor={scaleFactor} />
            </Sequence>
          );
        })}

        {/* 4. 动态文字元素 */}
        {content.textElements?.map((el) => {
          const startFrame = getAdjustedFrame(el.startTime);
          const durationFrames = durationToFrames(el.endTime - el.startTime);
          if (durationFrames <= 0) return null;
          return (
            <Sequence key={el.id} from={startFrame} durationInFrames={durationFrames}>
              <RenderTextElement element={el} scaleFactor={scaleFactor} />
            </Sequence>
          );
        })}

        {/* 5. 水印 (可选) */}
        {/* 如果 FFmpeg 阶段已经加了水印，这里就不需要。
            为了保险起见，如果 FFmpegCommandBuilder 里加了水印，这里就注释掉。
            根据之前的代码，FFmpeg 已经处理了 buildWatermarkTrack。
            所以这里**不需要** RenderWatermark。
        */}
        
        {/* 6. 遮罩 (Mask) - 不需要 */}
        {/* FFmpeg 已经烧录了马赛克，这里不需要 RenderMask */}

      </AbsoluteFill>
    );
  }

  // ===========================================================================
  // [分支 B] 完整渲染模式 (本地/前端/降级)
  // ===========================================================================
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      
      {/* 1. 原始视频轨道 */}
      {content.videoSequenceSegments && content.videoSequenceSegments.length > 0 ? (
        content.videoSequenceSegments.map((segment: TimelineSegment) => {
          if (segment.type === 'cut') return null;
          const durationFrames = durationToFrames(segment.duration);
          if (durationFrames <= 0) return null;
          const startFromFrame = rawMsToFrames(segment.sourceStartTime);
          const sequenceStartFrame = rawMsToFrames(segment.globalStartTime);
          const shouldMuteVideo = segment.type === 'main' && hasSeparatedTracks;
          const baseVolume = (segment.volume ?? 100) / 100;

          return (
            <Sequence key={segment.id} from={sequenceStartFrame} durationInFrames={durationFrames}>
              <OffthreadVideo
                src={segment.sourceUrl}
                startFrom={startFromFrame}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                volume={shouldMuteVideo ? 0 : (f) => {
                   const globalFrame = sequenceStartFrame + f;
                   return baseVolume * (backingVolumeMap[globalFrame] ?? 1); 
                }}
              />
            </Sequence>
          );
        })
      ) : (
        <OffthreadVideo 
          src={video.url}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          volume={hasSeparatedTracks ? 0 : (f) => backingVolumeMap[f] ?? 1}
        />
      )}

      {/* 2. B-Roll */}
      {content.subtitles?.map((sub) => {
        if (!sub.brollVideo) return null;
        const startFrame = getAdjustedFrame(sub.startTime);
        const durationFrames = durationToFrames(sub.endTime - sub.startTime);
        if (durationFrames <= 0) return null;
        return (
          <Sequence key={`broll-${sub.id}`} from={startFrame} durationInFrames={durationFrames}>
            <RenderBroll brollData={sub.brollVideo} subtitle={sub} />
          </Sequence>
        );
      })}

      {/* 3. 贴图 */}
      {content.placedMedia?.map((item) => {
        const startFrame = getAdjustedFrame(item.position.startTime);
        const durationFrames = durationToFrames(item.position.endTime - item.position.startTime);
        if (durationFrames <= 0) return null;
        return (
          <Sequence key={item.id} from={startFrame} durationInFrames={durationFrames}>
            <RenderMedia item={item} scaleFactor={scaleFactor} />
          </Sequence>
        );
      })}

      {/* 4. 字幕 */}
      {content.subtitles?.map((sub) => {
        const startFrame = getAdjustedFrame(sub.startTime);
        const durationFrames = durationToFrames(sub.endTime - sub.startTime);
        if (durationFrames <= 0) return null;
        return (
          <Sequence key={sub.id} from={startFrame} durationInFrames={durationFrames}>
            <RenderSubtitle subtitle={sub} scaleFactor={scaleFactor} />
          </Sequence>
        );
      })}

      {/* 5. 文本 */}
      {content.textElements?.map((el) => {
        const startFrame = getAdjustedFrame(el.startTime);
        const durationFrames = durationToFrames(el.endTime - el.startTime);
        if (durationFrames <= 0) return null;
        return (
          <Sequence key={el.id} from={startFrame} durationInFrames={durationFrames}>
            <RenderTextElement element={el} scaleFactor={scaleFactor} />
          </Sequence>
        );
      })}

      {/* 6. 水印 */}
      {settings?.watermark?.enabled && (
        <RenderWatermark config={settings.watermark} scaleFactor={scaleFactor} />
      )}
      
      {/* 7. 遮罩 (仅在此模式下需要) */}
      {settings?.mask?.enabled && (
         <RenderMask config={settings.mask} scaleFactor={scaleFactor} />
      )}

      {/* 8. 音频处理 (仅在此模式下需要) */}
      {hasSeparatedTracks && content.sourceResources && content.videoSequenceSegments && (
        content.videoSequenceSegments.map(segment => {
             if (segment.type !== 'main') return null;
             const durationFrames = durationToFrames(segment.duration);
             if (durationFrames <= 0) return null;
             const startFromFrame = rawMsToFrames(segment.sourceStartTime);
             const sequenceStartFrame = rawMsToFrames(segment.globalStartTime);
             return (
               <React.Fragment key={`audio-group-${segment.id}`}>
                 <Sequence from={sequenceStartFrame} durationInFrames={durationFrames}>
                    <Audio src={content.sourceResources!.audioVocals} startFrom={startFromFrame} volume={(f) => vocalVolumeMap[sequenceStartFrame + f] ?? 1} />
                 </Sequence>
                 <Sequence from={sequenceStartFrame} durationInFrames={durationFrames}>
                    <Audio src={content.sourceResources!.audioBacking} startFrom={startFromFrame} volume={(f) => backingVolumeMap[sequenceStartFrame + f] ?? 1} />
                 </Sequence>
               </React.Fragment>
             );
          })
      )}

      {/* 9. 背景音乐 */}
      {content.backgroundMusic && (
        <Audio src={content.backgroundMusic.url} volume={content.backgroundMusic.volume ?? 1} />
      )}

      {/* 10. 配音/音效 */}
      {content.subtitles?.map((sub) => sub.audioTrack && (
          <Sequence key={`vo-${sub.id}`} from={getAdjustedFrame(sub.startTime)}>
            <Audio src={sub.audioTrack.track.url} volume={sub.audioTrack.volume ?? 1} />
          </Sequence>
      ))}
      {content.subtitles?.map((sub) => sub.soundEffect && (
          <Sequence key={`sfx-${sub.id}`} from={getAdjustedFrame(sub.startTime)}>
            <Audio src={sub.soundEffect.track.url} volume={sub.soundEffect.volume ?? 1} />
          </Sequence>
      ))}

    </AbsoluteFill>
  );
};