import React, { useMemo } from 'react';
import { AbsoluteFill, Sequence, Audio, Video, useVideoConfig } from 'remotion';
import type { ProjectExport } from '@/types/project';
import type { TimelineSegment } from '@/types/videoSequence';
import { TimeWarpMap } from './utils/timeWarp';

import { RenderSubtitle } from './components/RenderSubtitle';
import { RenderTextElement } from './components/RenderTextElement';
import { RenderBroll } from './components/RenderBroll';
import { RenderMedia } from './components/RenderMedia';
import { RenderWatermark } from './components/RenderWatermark';
import { OffthreadVideo } from 'remotion';

export interface VideoCompositionProps {
  project: ProjectExport;
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({ project }) => {
  const { fps, height, durationInFrames } = useVideoConfig();
  const { content, settings, video } = project;

  const referenceHeight = settings.referenceHeight || 540;
  const scaleFactor = height / referenceHeight;

  const hasSeparatedTracks = !!(content.sourceResources?.audioVocals && content.sourceResources?.audioBacking);

  // ---------------------------------------------------------------------------
  // 1. 核心优化：预计算时间映射和音量表
  // ---------------------------------------------------------------------------
  const { timeWarper, backingVolumeMap, vocalVolumeMap } = useMemo(() => {
    // A. 构建时间映射器
    const mapper = new TimeWarpMap();
    mapper.build(content.videoSequenceSegments || []);

    // B. 初始化音量数组 (Float32Array 性能极佳)
    const backingMap = new Float32Array(durationInFrames).fill(1);
    const vocalMap = new Float32Array(durationInFrames).fill(1);

    // C. 如果没有字幕需要处理混音，直接返回
    if (!content.subtitles) {
      return { timeWarper: mapper, backingVolumeMap: backingMap, vocalVolumeMap: vocalMap };
    }

    // D. 遍历字幕，将音量变化“涂”到数组上 (O(N) 复杂度，仅执行一次)
    content.subtitles.forEach((sub) => {
      // 只有设置了 sourceMix 的字幕才需要调整背景音量
      if (!sub.sourceMix) return;

      // 使用 timeWarper 获取准确的全局时间 (毫秒)
      const globalStartMs = mapper.getNewTime(sub.startTime);
      const globalEndMs = mapper.getNewTime(sub.endTime);

      // 转换为帧索引
      const startFrame = Math.round((globalStartMs / 1000) * fps);
      const endFrame = Math.round((globalEndMs / 1000) * fps);

      // 边界检查
      const safeStart = Math.max(0, startFrame);
      const safeEnd = Math.min(durationInFrames, endFrame);

      const backingVol = sub.sourceMix.backingVolume ?? 1;
      const vocalVol = sub.sourceMix.originalVocalVolume ?? 1;

      // 填充数组
      for (let i = safeStart; i < safeEnd; i++) {
        backingMap[i] = backingVol;
        vocalMap[i] = vocalVol;
      }
    });

    return { timeWarper: mapper, backingVolumeMap: backingMap, vocalVolumeMap: vocalMap };
  }, [content.subtitles, content.videoSequenceSegments, durationInFrames, fps]);

  // 辅助函数：获取调整后的帧位置
  const getAdjustedFrame = (ms: number) => {
    const newTime = timeWarper.getNewTime(ms);
    return Math.round((newTime / 1000) * fps);
  };

  const durationToFrames = (ms: number) => Math.round((ms / 1000) * fps);
  const rawMsToFrames = (ms: number) => Math.round((ms / 1000) * fps);

  // ---------------------------------------------------------------------------
  // 2. 渲染组件树
  // ---------------------------------------------------------------------------

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      
      {/* 1. 视频轨道 */}
      {content.videoSequenceSegments && content.videoSequenceSegments.length > 0 ? (
        content.videoSequenceSegments.map((segment: TimelineSegment) => {
          if (segment.type === 'cut') return null;
          const durationFrames = durationToFrames(segment.duration);
          const startFromFrame = rawMsToFrames(segment.sourceStartTime);
          const sequenceStartFrame = rawMsToFrames(segment.globalStartTime);

          const shouldMuteVideo = segment.type === 'main' && hasSeparatedTracks;

          return (
            <Sequence
              key={segment.id}
              from={sequenceStartFrame}
              durationInFrames={durationFrames}
            >
              <OffthreadVideo
                src={segment.sourceUrl}
                startFrom={startFromFrame}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                // 使用预计算的数组，O(1) 读取
                volume={shouldMuteVideo ? 0 : (f) => {
                   const globalFrame = sequenceStartFrame + f;
                   return backingVolumeMap[globalFrame] ?? 1;
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

      {/* 2. B-Roll (画中画) */}
      {content.subtitles?.map((sub) => {
        if (!sub.brollVideo) return null;
        const startFrame = getAdjustedFrame(sub.startTime);
        const durationFrames = durationToFrames(sub.endTime - sub.startTime);
        return (
          <Sequence key={`broll-${sub.id}`} from={startFrame} durationInFrames={durationFrames}>
            <RenderBroll brollData={sub.brollVideo} subtitle={sub} />
          </Sequence>
        );
      })}

      {/* 3. 贴图素材 */}
      {content.placedMedia?.map((item) => {
        const startFrame = getAdjustedFrame(item.position.startTime);
        const durationFrames = durationToFrames(item.position.endTime - item.position.startTime);
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
        return (
          <Sequence key={sub.id} from={startFrame} durationInFrames={durationFrames}>
            <RenderSubtitle subtitle={sub} scaleFactor={scaleFactor} />
          </Sequence>
        );
      })}

      {/* 5. 文本元素 */}
      {content.textElements?.map((el) => {
        const startFrame = getAdjustedFrame(el.startTime);
        const durationFrames = durationToFrames(el.endTime - el.startTime);
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

      {/* 7. 音频：分离轨道 (人声/伴奏) */}
      {hasSeparatedTracks && content.sourceResources && content.videoSequenceSegments && (
        content.videoSequenceSegments.map(segment => {
             if (segment.type !== 'main') return null;
             
             const durationFrames = durationToFrames(segment.duration);
             const startFromFrame = rawMsToFrames(segment.sourceStartTime);
             const sequenceStartFrame = rawMsToFrames(segment.globalStartTime);

             return (
               <React.Fragment key={`audio-group-${segment.id}`}>
                 <Sequence from={sequenceStartFrame} durationInFrames={durationFrames}>
                    <Audio 
                      src={content.sourceResources!.audioVocals}
                      startFrom={startFromFrame} 
                      // O(1) 查表
                      volume={(f) => {
                        const globalFrame = sequenceStartFrame + f;
                        return vocalVolumeMap[globalFrame] ?? 1;
                      }}
                    />
                 </Sequence>
                 <Sequence from={sequenceStartFrame} durationInFrames={durationFrames}>
                    <Audio 
                      src={content.sourceResources!.audioBacking}
                      startFrom={startFromFrame}
                      // O(1) 查表
                      volume={(f) => {
                        const globalFrame = sequenceStartFrame + f;
                        return backingVolumeMap[globalFrame] ?? 1;
                      }}
                    />
                 </Sequence>
               </React.Fragment>
             );
          })
      )}

      {/* 8. 背景音乐 */}
      {content.backgroundMusic && (
        <Audio 
          src={content.backgroundMusic.url}
          volume={content.backgroundMusic.volume ?? 1}
        />
      )}

      {/* 9. 配音 (Voiceover) */}
      {content.subtitles?.map((sub) => {
        if (!sub.audioTrack) return null;
        const volume = sub.audioTrack.volume ?? 1;
        return (
          <Sequence key={`vo-${sub.id}`} from={getAdjustedFrame(sub.startTime)}>
            <Audio 
              src={sub.audioTrack.track.url}
              volume={volume}
            />
          </Sequence>
        );
      })}

      {/* 10. 音效 (SFX) */}
      {content.subtitles?.map((sub) => {
        if (!sub.soundEffect) return null;
        const volume = sub.soundEffect.volume ?? 1;
        return (
          <Sequence key={`sfx-${sub.id}`} from={getAdjustedFrame(sub.startTime)}>
            <Audio 
              src={sub.soundEffect.track.url}
              volume={volume}
            />
          </Sequence>
        );
      })}

    </AbsoluteFill>
  );
};