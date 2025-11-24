import type { ProjectExport } from '@/types/project';
import type { TimelineSegment } from '@/types/videoSequence';
import type { SubtitleItem, SubtitleStyle } from '@/types/subtitle';
import { DEFAULT_SUBTITLE_STYLE, DEFAULT_SUBTITLE_POSITION } from '@/types/subtitle';
import type { TextElement } from '@/types/textElement';
import type { PlacedMediaItem } from '@/types/media';
import type { WatermarkConfig } from '@/types/settings';
import type { AnimationEffect } from '@/types/animation';
import {
  type FFmpegTarget,
  InputMapper,
  msToS,
  escapeFfmpegText,
} from './ffmpegUtils';
import {
  buildTextStyle,
  buildWatermarkStyle,
} from './ffmpegStyleBuilder';

type GetNewTimeFn = (globalTime: number) => number;

export const buildVideoTrack = (
  segments: TimelineSegment[],
  mapper: InputMapper,
  targetW: number,
  targetH: number
): { videoStream: string; audioStream: string; filters: string[] } => {
  const filters: string[] = [];
  const videoSegmentStreams: string[] = [];
  const audioSegmentStreams: string[] = [];

  const activeSegments = segments.filter(seg => seg.type !== 'cut');

  activeSegments.forEach((segment, i) => {
    const inputIndex = mapper.getIndex(segment.sourceUrl);
    const videoInput = `[${inputIndex}:v]`;
    const audioInput = `[${inputIndex}:a]`;

    const preConcatFilters = [
      `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease`,
      `pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black`,
      `trim=start=${msToS(segment.sourceStartTime)}:duration=${msToS(segment.duration)}`,
      `setpts=PTS-STARTPTS`,
      `setsar=1`
    ];

    const vSeg = `[v_seg_${i}]`;
    const aSeg = `[a_seg_${i}]`;
    
    filters.push(`${videoInput}${preConcatFilters.join(',')}${vSeg}`);
    filters.push(`${audioInput}atrim=start=${msToS(segment.sourceStartTime)}:duration=${msToS(segment.duration)},asetpts=PTS-STARTPTS${aSeg}`);
    
    videoSegmentStreams.push(vSeg);
    audioSegmentStreams.push(aSeg);
  });

  if (videoSegmentStreams.length === 0 || audioSegmentStreams.length === 0) {
    const totalDurationMs = segments.reduce((sum, seg) => seg.type !== 'cut' ? sum + seg.duration : sum, 0);
    const totalDurationS = msToS(totalDurationMs) || 1; 
    
    filters.push(`nullsrc=size=${targetW}x${targetH}:duration=${totalDurationS}:r=30[base_v]`);
    filters.push(`anullsrc=channel_layout=stereo:sample_rate=44100:duration=${totalDurationS}[base_a]`);
  } else {
    filters.push(
      `${videoSegmentStreams.join('')}concat=n=${videoSegmentStreams.length}:v=1:a=0[base_v]`
    );
    filters.push(
      `${audioSegmentStreams.join('')}concat=n=${audioSegmentStreams.length}:v=0:a=1[base_a]`
    );
  }

  return {
    videoStream: '[base_v]',
    audioStream: '[base_a]',
    filters,
  };
};

export const buildAudioTrack = (
  content: ProjectExport['content'],
  baseAudioStream: string,
  mapper: InputMapper,
  getNewTime: GetNewTimeFn
): { audioStream: string; filters: string[] } => {
  const filters: string[] = [];
  
  let currentBaseAudio = baseAudioStream;
  const voiceoverStreams: string[] = [];
  const sfxStreams: string[] = [];
  const muteRanges: string[] = [];

  (content.subtitles || []).forEach((sub: SubtitleItem, i) => {
    if (sub.audioTrack) {
      const newStartTimeS = msToS(getNewTime(sub.startTime));
      const newEndTimeS = msToS(getNewTime(sub.endTime));
      
      if (newEndTimeS <= newStartTimeS) return;

      muteRanges.push(`between(t,${newStartTimeS},${newEndTimeS})`);

      const track = sub.audioTrack.track;
      const audioInput = `[${mapper.getIndex(track.url)}:a]`;
      const streamName = `[voice_${i}]`;
      filters.push(
        `${audioInput}adelay=${newStartTimeS * 1000}|${newStartTimeS * 1000},volume=${sub.audioTrack.volume}${streamName}`
      );
      voiceoverStreams.push(streamName);
    }
    
    if (sub.soundEffect) {
      const newStartTimeMs = getNewTime(sub.startTime);
      const track = sub.soundEffect.track;
      const audioInput = `[${mapper.getIndex(track.url)}:a]`;
      const streamName = `[sfx_${i}]`;
      filters.push(
        `${audioInput}adelay=${newStartTimeMs}|${newStartTimeMs},volume=${sub.soundEffect.volume}${streamName}`
      );
      sfxStreams.push(streamName);
    }
  });

  if (muteRanges.length > 0) {
    const muteExpr = muteRanges.join('+');
    filters.push(
      `${baseAudioStream}volume=enable='${muteExpr}':volume=0[muted_base_a]`
    );
    currentBaseAudio = '[muted_base_a]';
  }
  
  const bgmStreams: string[] = [];
  if (content.backgroundMusic) {
    const bgm = content.backgroundMusic;
    const bgmInput = `[${mapper.getIndex(bgm.url)}:a]`;
    filters.push(`${bgmInput}volume=${bgm.volume}[bgm]`);
    bgmStreams.push('[bgm]');
  }

  const allStreamsToMix = [currentBaseAudio, ...bgmStreams, ...voiceoverStreams, ...sfxStreams];

  if (allStreamsToMix.length > 1) {
    filters.push(
      `${allStreamsToMix.join('')}amix=inputs=${allStreamsToMix.length}[final_a]`
    );
    return { audioStream: '[final_a]', filters };
  } else {
    return { audioStream: baseAudioStream, filters };
  }
};

export const buildMediaTrack = (
  mediaItems: PlacedMediaItem[],
  lastStream: string,
  mapper: InputMapper,
  getNewTime: GetNewTimeFn,
  targetW: number,
  _targetH: number,
  scaleFactor: number
): { videoStream: string; filters: string[] } => {
  const filters: string[] = [];
  let currentStream = lastStream;

  mediaItems.forEach((item, i) => {
    const mediaInputIndex = mapper.getIndex(item.media.url);
    const mediaInput = `[${mediaInputIndex}:v]`;
    const pos = item.position;
    const nextV = `[v_media_${i}]`;
    const processedMedia = `[media_processed_${i}]`;

    const newStartTimeS = msToS(getNewTime(pos.startTime));
    const newEndTimeS = msToS(getNewTime(pos.endTime));
    const durationS = newEndTimeS - newStartTimeS;

    const baseWidth = item.media.width || 0;
    const baseHeight = item.media.height || 0;
    
    let scaleFilterString = '';

    if (pos.width && pos.width > 0) {
      const targetPixelW = Math.trunc(targetW * (pos.width / 100) * pos.scaleX / 2) * 2;
      scaleFilterString = `scale=${targetPixelW > 0 ? targetPixelW : -1}:-1:flags=bicubic`;
    } else if (baseWidth > 0 && baseHeight > 0) {
      const targetPixelW = Math.trunc(baseWidth * pos.scaleX * scaleFactor / 2) * 2;
      const targetPixelH = Math.trunc(baseHeight * pos.scaleY * scaleFactor / 2) * 2;
      scaleFilterString = `scale=${targetPixelW > 0 ? targetPixelW : -1}:${targetPixelH > 0 ? targetPixelH : -1}:flags=bicubic`;
    } else {
       scaleFilterString = `scale=trunc(iw*${scaleFactor}*${pos.scaleX}/2)*2:-1:flags=bicubic`;
    }

    const transformFilters = [
      `format=rgba`,
      `loop=-1:32767:0`, 
      `trim=duration=${durationS}`,
      `setpts=PTS-STARTPTS+${newStartTimeS}/TB`, 
      `setsar=1`,
      scaleFilterString,
      `rotate=${pos.rotation}*PI/180:c=none:ow=rotw(iw):oh=roth(ih)`
    ];
    
    filters.push(`${mediaInput}${transformFilters.join(',')}${processedMedia}`);

    const x = `W*${pos.x}/100-w/2`;
    const y = `H*${pos.y}/100-h/2`;
    
    filters.push(
      `${currentStream}${processedMedia}overlay=x='${x}':y='${y}':enable='between(t,${newStartTimeS},${newEndTimeS})'${nextV}`
    );
    currentStream = nextV;
  });

  return { videoStream: currentStream, filters };
};

export const buildBrollTrack = (
  
  subtitles: SubtitleItem[],
  lastStream: string,
  mapper: InputMapper,
  getNewTime: GetNewTimeFn
): { videoStream: string; filters: string[]; brollRanges: string[] } => {
  const filters: string[] = [];
  const brollRanges: string[] = [];
  let currentStream = lastStream;

  subtitles.forEach((sub: SubtitleItem, i) => {
    if (sub.brollVideo) {
      const newStartTimeS = msToS(getNewTime(sub.startTime));
      const newEndTimeS = msToS(getNewTime(sub.endTime));

      if (newEndTimeS <= newStartTimeS) return;

      const broll = sub.brollVideo;
      const brollInputIndex = mapper.getIndex(broll.video.url);
      const brollInput = `[${brollInputIndex}:v]`;
      const nextV = `[v_broll_${i}]`;
      let brollStream = `[broll_pre_${i}]`;

      
      brollRanges.push(`between(t,${newStartTimeS},${newEndTimeS})`);
      
      const trimStartS = msToS(broll.startOffset || 0);
      const durationS = newEndTimeS - newStartTimeS;
    
      const preProcessFilter = `trim=start=${trimStartS}:duration=${durationS},setpts=PTS-STARTPTS`;
      
      let transitionFilter = '';
      if (broll.transition === 'fade') {
        
        transitionFilter = `,fade=type=in:st=0:d=0.3,fade=type=out:st=${durationS - 0.3}:d=0.3`;
      } else if (broll.transition === 'glow') {
        const brightness = `'if(lt(t,0.3), 1 + 0.3*t/0.3, if(gt(t,${durationS - 0.3}), 1 + 0.3 - 0.3*(t-${durationS - 0.3})/0.3, 1))'`;
        transitionFilter = `,eq=brightness=${brightness}`;
      }
      
      const timeShiftFilter = `,setpts=PTS+${newStartTimeS}/TB,setsar=1`;

      filters.push(`${brollInput}${preProcessFilter}${transitionFilter}${timeShiftFilter}${brollStream}`);
      
      filters.push(
        `${currentStream}${brollStream}overlay=enable='between(t,${newStartTimeS},${newEndTimeS})'${nextV}`
      );
      currentStream = nextV;
    }
  });

  return { videoStream: currentStream, filters, brollRanges };
};

const buildAnimationFilter = (
  effect: AnimationEffect,
  baseStyle: string,
  startTimeS: number,
  yExpr: string
): string => {
  const durationS = msToS(effect.duration);
  const animEndS = startTimeS + durationS;
  
  switch (effect.name) {
    case 'fadeIn':
      return baseStyle.replace(
        /(alpha=)[\d.]+/g,
        `$1'if(lt(t,${startTimeS}),0,if(lt(t,${animEndS}),(t-${startTimeS})/${durationS},1))'`
      );
    case 'slideUp':
      const animatedY = `'if(lt(t,${startTimeS}),(${yExpr})+30,if(lt(t,${animEndS}),(${yExpr})+30-30*(t-${startTimeS})/${durationS},(${yExpr})))'`;
      return baseStyle.replace(`y=${yExpr}`, `y=${animatedY}`);
    
    default:
      return baseStyle;
  }
};

export const buildTextTrack = (
  content: ProjectExport['content'],
  brollRanges: string[],
  segments: TimelineSegment[],
  lastStream: string,
  target: FFmpegTarget,
  getNewTime: GetNewTimeFn,
  scaleFactor: number = 1.0
): { videoStream: string; filters: string[] } => {
  const filters: string[] = [];
  let currentStream = lastStream;

  const brollEnableExpr = brollRanges.length > 0
    ? `*not(${brollRanges.join('+')})`
    : '';
    
  const insertRanges: string[] = [];
  segments.forEach(seg => {
    if (seg.type === 'insert') {
      const newStartTimeS = msToS(seg.globalStartTime);
      const newEndTimeS = msToS(seg.globalStartTime + seg.duration);
      if (newEndTimeS > newStartTimeS) {
        insertRanges.push(`between(t,${newStartTimeS},${newEndTimeS})`);
      }
    }
  });
  const insertEnableExpr = insertRanges.length > 0
    ? `*not(${insertRanges.join('+')})`
    : '';
  
  (content.subtitles || []).forEach((sub: SubtitleItem, i) => {
    const newStartTimeS = msToS(getNewTime(sub.startTime));
    const newEndTimeS = msToS(getNewTime(sub.endTime));
    
    if (newEndTimeS <= newStartTimeS) return;

    const pos = sub.position || { ...DEFAULT_SUBTITLE_POSITION };
    const baseStyle: SubtitleStyle = { ...DEFAULT_SUBTITLE_STYLE, ...sub.style };
    const richSegments = sub.richText || [{ text: sub.text, style: sub.style }];

    richSegments.forEach((seg, j) => {
      const segStyle: SubtitleStyle = { ...baseStyle, ...seg.style };
      const nextV = `[v_sub_${i}_${j}]`;
      const escapedText = escapeFfmpegText(seg.text);
      
      let textFilter = buildTextStyle(segStyle, pos, target, scaleFactor);
      
      const yMatch = textFilter.match(/y=([^:]+)/);
      const yExpr = yMatch ? yMatch[1] : `(h*${pos.y}/100)-(text_h/2)`;

      if (seg.animation) {
        textFilter = buildAnimationFilter(seg.animation, textFilter, newStartTimeS, yExpr);
      }
      
      textFilter += `:enable='between(t,${newStartTimeS},${newEndTimeS})${brollEnableExpr}${insertEnableExpr}'`;
      
      filters.push(`${currentStream}drawtext=text='${escapedText}':${textFilter}${nextV}`);
      currentStream = nextV;
    });
  });

  (content.textElements || []).forEach((el: TextElement, i) => {
    const newStartTimeS = msToS(getNewTime(el.startTime));
    const newEndTimeS = msToS(getNewTime(el.endTime));

    if (newEndTimeS <= newStartTimeS) return;
    
    const pos = el.position;
    const baseStyle: SubtitleStyle = { ...DEFAULT_SUBTITLE_STYLE, ...el.style };
    const richSegments = el.richText || [{ text: el.text, style: el.style }];

    richSegments.forEach((seg, j) => {
      const segStyle: SubtitleStyle = { ...baseStyle, ...seg.style };
      const nextV = `[v_txt_${i}_${j}]`;
      const escapedText = escapeFfmpegText(seg.text);
      
      let textFilter = buildTextStyle(segStyle, pos, target, scaleFactor);
      
      const yMatch = textFilter.match(/y=([^:]+)/);
      const yExpr = yMatch ? yMatch[1] : `(h*${pos.y}/100)-(text_h/2)`;

      if (seg.animation) {
        textFilter = buildAnimationFilter(seg.animation, textFilter, newStartTimeS, yExpr);
      }
      
      textFilter += `:enable='between(t,${newStartTimeS},${newEndTimeS})${brollEnableExpr}${insertEnableExpr}'`;

      if (pos.rotation !== 0) {
        const rotatedV = `[v_txt_rotated_${i}_${j}]`;
        const canvasV = `[v_txt_canvas_${i}_${j}]`;
        filters.push(`nullsrc=size=1920x1080:color=black@0.0,format=rgba[canvas]`);
        filters.push(`[canvas][${currentStream}]scale2ref[canvas_scaled][base_scaled]`);
        filters.push(`[canvas_scaled]drawtext=text='${escapedText}':${textFilter}${canvasV}`);
        filters.push(`${canvasV}rotate=${pos.rotation}*PI/180:c=none:ow=rotw(iw):oh=roth(ih)${rotatedV}`);
        filters.push(`[base_scaled]${rotatedV}overlay=(W-w)/2:(H-h)/2${nextV}`);
        
      } else {
        filters.push(`${currentStream}drawtext=text='${escapedText}':${textFilter}${nextV}`);
      }
      currentStream = nextV;
    });
  });

  return { videoStream: currentStream, filters };
};

export const buildWatermarkTrack = (
  watermark: WatermarkConfig | undefined,
  isPremium: boolean,
  lastStream: string,
  target: FFmpegTarget
): { videoStream: string; filters: string[] } => {
  const filters: string[] = [];
  
  const isWatermarkEnabled = (watermark && watermark.enabled) || !isPremium;
  
  if (watermark && isWatermarkEnabled) {
    const wmStyle = buildWatermarkStyle(watermark, target);
    const nextV = '[v_with_wm]';
    const escapedWatermarkText = escapeFfmpegText(watermark.text || '');

    filters.push(
      `${lastStream}drawtext=text='${escapedWatermarkText}':${wmStyle}${nextV}`
    );
    return { videoStream: nextV, filters };
  }
  
  return { videoStream: lastStream, filters };
};