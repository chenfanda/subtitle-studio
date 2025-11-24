import React, { useMemo } from 'react';
import { AbsoluteFill, Sequence, Audio, Video, useVideoConfig } from 'remotion';
import type { ProjectExport } from '@/types/project';
import type { TimelineSegment } from '@/types/videoSequence';
import { TimeWarpMap } from './utils/timeWarp'; // 🟢 1. 引入工具

import { RenderSubtitle } from './components/RenderSubtitle';
import { RenderTextElement } from './components/RenderTextElement';
import { RenderBroll } from './components/RenderBroll';
import { RenderMedia } from './components/RenderMedia';
import { RenderWatermark } from './components/RenderWatermark';

export interface VideoCompositionProps {
  project: ProjectExport;
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({ project }) => {
  const { fps, height } = useVideoConfig();
  const { content, settings, video } = project;

  const referenceHeight = settings.referenceHeight || 540; 
  const scaleFactor = height / referenceHeight;

  // 🟢 2. 初始化并构建 TimeWarpMap
  const timeWarper = useMemo(() => {
    const mapper = new TimeWarpMap();
    mapper.build(content.videoSequenceSegments || []);
    return mapper;
  }, [content.videoSequenceSegments]);

  // 🟢 3. 升级版时间转换函数：先做映射，再转帧数
  const getAdjustedFrame = (ms: number) => {
    // 将原始时间(ms) -> 映射后的新时间(ms) -> 帧数
    const newTime = timeWarper.getNewTime(ms);
    return Math.round((newTime / 1000) * fps);
  };

  // 普通转帧函数 (用于处理时长 duration，时长不需要映射)
  const durationToFrames = (ms: number) => Math.round((ms / 1000) * fps);
  // 原始转帧函数 (用于 videoSequence 本身的时间点)
  const rawMsToFrames = (ms: number) => Math.round((ms / 1000) * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      
      {/* 1. 主视频轨道 (逻辑不变，因为它定义了时间基准) */}
      {content.videoSequenceSegments && content.videoSequenceSegments.length > 0 ? (
        content.videoSequenceSegments.map((segment: TimelineSegment) => {
          if (segment.type === 'cut') return null;
          const durationInFrames = durationToFrames(segment.duration);
          const startFromFrame = rawMsToFrames(segment.sourceStartTime);
          const sequenceStartFrame = rawMsToFrames(segment.globalStartTime);

          return (
            <Sequence
              key={segment.id}
              from={sequenceStartFrame}
              durationInFrames={durationInFrames}
            >
              <Video
                src={segment.sourceUrl}
                startFrom={startFromFrame}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                volume={1}
              />
            </Sequence>
          );
        })
      ) : (
        <Video src={video.url} />
      )}

      {/* 2. B-Roll (应用 getAdjustedFrame) */}
      {content.subtitles && content.subtitles.map((sub) => {
        if (!sub.brollVideo) return null;
        
        // 🟢 使用修正后的时间
        const startFrame = getAdjustedFrame(sub.startTime);
        // 时长是不变的，所以用普通转换
        const durationFrames = durationToFrames(sub.endTime - sub.startTime);

        return (
          <Sequence key={`broll-${sub.id}`} from={startFrame} durationInFrames={durationFrames}>
            <RenderBroll 
              brollData={sub.brollVideo} 
              subtitle={sub} 
            />
          </Sequence>
        );
      })}

      {/* 3. 贴纸与 GIF (应用 getAdjustedFrame) */}
      {content.placedMedia && content.placedMedia.map((item) => {
        // 🟢 使用修正后的时间
        const startFrame = getAdjustedFrame(item.position.startTime);
        const durationFrames = durationToFrames(item.position.endTime - item.position.startTime);

        return (
          <Sequence key={item.id} from={startFrame} durationInFrames={durationFrames}>
            <RenderMedia 
              item={item} 
              scaleFactor={scaleFactor}
            />
          </Sequence>
        );
      })}

      {/* 4. 字幕层 (应用 getAdjustedFrame) */}
      {content.subtitles && content.subtitles.map((sub) => {
        // 🟢 使用修正后的时间
        const startFrame = getAdjustedFrame(sub.startTime);
        const durationFrames = durationToFrames(sub.endTime - sub.startTime);

        return (
          <Sequence key={sub.id} from={startFrame} durationInFrames={durationFrames}>
            <RenderSubtitle 
              subtitle={sub} 
              scaleFactor={scaleFactor} 
            />
          </Sequence>
        );
      })}

      {/* 5. 贴纸文字层 (应用 getAdjustedFrame) */}
      {content.textElements && content.textElements.map((el) => {
        // 🟢 使用修正后的时间
        const startFrame = getAdjustedFrame(el.startTime);
        const durationFrames = durationToFrames(el.endTime - el.startTime);

        return (
          <Sequence key={el.id} from={startFrame} durationInFrames={durationFrames}>
            <RenderTextElement 
              element={el} 
              scaleFactor={scaleFactor}
            />
          </Sequence>
        );
      })}

      {/* 6. 水印层 (不变) */}
      {settings?.watermark?.enabled && (
        <RenderWatermark 
          config={settings.watermark} 
          scaleFactor={scaleFactor}
        />
      )}

      {/* 7. 音频 (注意：背景音乐通常不用变，但配音要变) */}
      {content.backgroundMusic && (
        <Audio 
          src={content.backgroundMusic.url}
          volume={content.backgroundMusic.volume / 100}
        />
      )}

      {content.subtitles && content.subtitles.map((sub) => {
        if (!sub.audioTrack) return null;
        return (
          // 🟢 配音也要跟随字幕移动
          <Sequence key={`vo-${sub.id}`} from={getAdjustedFrame(sub.startTime)}>
            <Audio 
              src={sub.audioTrack.track.url}
              volume={sub.audioTrack.volume / 100}
            />
          </Sequence>
        );
      })}

      {content.subtitles && content.subtitles.map((sub) => {
        if (!sub.soundEffect) return null;
        return (
          // 🟢 音效同理
          <Sequence key={`sfx-${sub.id}`} from={getAdjustedFrame(sub.startTime)}>
            <Audio 
              src={sub.soundEffect.track.url}
              volume={sub.soundEffect.volume / 100}
            />
          </Sequence>
        );
      })}

    </AbsoluteFill>
  );
};