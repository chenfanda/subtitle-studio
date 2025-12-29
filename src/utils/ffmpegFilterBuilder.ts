import type { ProjectExport } from '@/types/project';
import type { TimelineSegment } from '@/types/videoSequence';
import type { SubtitleItem, SubtitleStyle } from '@/types/subtitle';
import { DEFAULT_SUBTITLE_STYLE, DEFAULT_SUBTITLE_POSITION } from '@/types/subtitle';
import type { TextElement } from '@/types/textElement';
import type { PlacedMediaItem } from '@/types/media';
import type { WatermarkConfig, MaskConfig  } from '@/types/settings';
import type { AnimationEffect } from '@/types/animation';
import {
  type FFmpegTarget,
  InputMapper,
  msToS,
  escapeFfmpegText,
} from './ffmpegUtils';
import {
  buildTextStyle,
} from './ffmpegStyleBuilder';

type GetNewTimeFn = (globalTime: number) => number;

export const buildVideoTrack = (
  segments: TimelineSegment[],
  sourceResources: ProjectExport['content']['sourceResources'],
  mapper: InputMapper,
  targetW: number,
  targetH: number
): { 
  videoStream: string; 
  audioStream: string; 
  vocalsStream?: string; 
  backingStream?: string; 
  filters: string[] 
} => {
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

    const volumeVal = (segment.volume ?? 100) / 100;
    let audioFilterChain = `atrim=start=${msToS(segment.sourceStartTime)}:duration=${msToS(segment.duration)},asetpts=PTS-STARTPTS`;
    
    if (volumeVal !== 1) {
        audioFilterChain += `,volume=${volumeVal}`;
    }
    
    filters.push(`${videoInput}${preConcatFilters.join(',')}${vSeg}`);
    filters.push(`${audioInput}${audioFilterChain}${aSeg}`);
    
    
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

  let vocalsStream: string | undefined;
  let backingStream: string | undefined;
  if (sourceResources?.audioVocals && sourceResources?.audioBacking) {
    const vocalsInput = `[${mapper.getIndex(sourceResources.audioVocals)}:a]`;
    const backingInput = `[${mapper.getIndex(sourceResources.audioBacking)}:a]`;
    vocalsStream = '[base_vocals]';
    backingStream = '[base_backing]';
    filters.push(`${vocalsInput}acopy${vocalsStream}`);
    filters.push(`${backingInput}acopy${backingStream}`);
  }

  return {
    videoStream: '[base_v]',
    audioStream: '[base_a]',
    vocalsStream,
    backingStream,
    filters,
  };
};

export const buildAudioTrack = (
  content: ProjectExport['content'],
  audioInputs: {
    baseAudio: string;
    vocals?: string;
    backing?: string;
  },
  mapper: InputMapper,
  getNewTime: GetNewTimeFn
): { audioStream: string; filters: string[] } => {
  const filters: string[] = [];
  const hasSeparatedTracks = !!(audioInputs.vocals && audioInputs.backing);
  const UNIFIED_AUDIO_FORMAT = 'aformat=sample_rates=44100:channel_layouts=stereo';

  const volumeChanges: { start: number; end: number; vocalsVol: number; backingVol: number }[] = [];

  interface AudioLaneItem {
    url: string;
    start: number;
    end: number;
    volume: number;
    id: string;
  }
  const audioClips: AudioLaneItem[] = [];

  (content.subtitles || []).forEach((sub, i) => {
    const newStartTimeS = msToS(getNewTime(sub.startTime));
    const newEndTimeS = msToS(getNewTime(sub.endTime));

    if (newEndTimeS <= newStartTimeS) return;

    if (sub.sourceMix) {
      volumeChanges.push({
        start: newStartTimeS,
        end: newEndTimeS,
        vocalsVol: sub.sourceMix.originalVocalVolume ?? 1,
        backingVol: sub.sourceMix.backingVolume ?? 1
      });
    }

    if (sub.audioTrack) {
      audioClips.push({
        url: sub.audioTrack.track.url,
        start: newStartTimeS,
        end: newEndTimeS,
        volume: sub.audioTrack.volume ?? 1,
        id: `vo_${i}`
      });
    }

    if (sub.soundEffect) {
      audioClips.push({
        url: sub.soundEffect.track.url,
        start: newStartTimeS,
        end: newEndTimeS,
        volume: sub.soundEffect.volume ?? 1,
        id: `sfx_${i}`
      });
    }
  });

  const streamsToMix: string[] = [];

  if (audioClips.length > 0) {
    audioClips.sort((a, b) => a.start - b.start);

    const lanes: AudioLaneItem[][] = [];

    for (const clip of audioClips) {
      let placed = false;
      for (const lane of lanes) {
        const lastClip = lane[lane.length - 1];
        if (clip.start >= lastClip.end - 0.05) {
          lane.push(clip);
          placed = true;
          break;
        }
      }
      if (!placed) {
        lanes.push([clip]);
      }
    }

    lanes.forEach((lane, laneIndex) => {
      const segmentStreams: string[] = [];
      let currentTime = 0;

      lane.forEach((clip, clipIndex) => {
        if (clip.start > currentTime + 0.01) {
          const gapDuration = clip.start - currentTime;
          const gapStream = `[gap_${laneIndex}_${clipIndex}]`;
          filters.push(`anullsrc=channel_layout=stereo:sample_rate=44100:duration=${gapDuration},${UNIFIED_AUDIO_FORMAT}${gapStream}`);
          segmentStreams.push(gapStream);
        }

        const inputIndex = mapper.getIndex(clip.url);
        const clipDuration = clip.end - clip.start;
        const clipStream = `[clip_${laneIndex}_${clipIndex}]`;

        filters.push(
          `[${inputIndex}:a]atrim=start=0:duration=${clipDuration},asetpts=PTS-STARTPTS,volume=${clip.volume},${UNIFIED_AUDIO_FORMAT}${clipStream}`
        );
        segmentStreams.push(clipStream);

        currentTime = clip.end;
      });

      const laneStream = `[lane_${laneIndex}]`;
      if (segmentStreams.length > 0) {
        filters.push(`${segmentStreams.join('')}concat=n=${segmentStreams.length}:v=0:a=1${laneStream}`);
        streamsToMix.push(laneStream);
      }
    });
  }

  if (hasSeparatedTracks && audioInputs.vocals && audioInputs.backing) {
    let vocalsVolumeExpr = '1';
    for (let i = volumeChanges.length - 1; i >= 0; i--) {
      const change = volumeChanges[i];
      if (Math.abs(change.vocalsVol - 1) > 0.01) {
        vocalsVolumeExpr = `if(between(t,${change.start},${change.end}),${change.vocalsVol},${vocalsVolumeExpr})`;
      }
    }
    filters.push(`${audioInputs.vocals}volume='${vocalsVolumeExpr}':eval=frame,${UNIFIED_AUDIO_FORMAT}[processed_vocals]`);
    streamsToMix.push('[processed_vocals]');

    let backingVolumeExpr = '1';
    for (let i = volumeChanges.length - 1; i >= 0; i--) {
      const change = volumeChanges[i];
      if (Math.abs(change.backingVol - 1) > 0.01) {
        backingVolumeExpr = `if(between(t,${change.start},${change.end}),${change.backingVol},${backingVolumeExpr})`;
      }
    }
    filters.push(`${audioInputs.backing}volume='${backingVolumeExpr}':eval=frame,${UNIFIED_AUDIO_FORMAT}[processed_backing]`);
    streamsToMix.push('[processed_backing]');

    const insertSegments = (content.videoSequenceSegments || []).filter(seg => seg.type === 'insert');

    if (insertSegments.length > 0) {
      let insertVolumeExpr = '0';
      let currentTimeCursor = 0;
      const allSegments = content.videoSequenceSegments || [];

      allSegments.forEach(seg => {
        const segDurationS = msToS(seg.duration);
        const startS = msToS(currentTimeCursor);
        const endS = startS + segDurationS;

        if (seg.type === 'insert') {
          insertVolumeExpr = `if(between(t,${startS},${endS}),1,${insertVolumeExpr})`;
        }

        if (seg.type !== 'cut') {
          currentTimeCursor += seg.duration;
        }
      });

      filters.push(`${audioInputs.baseAudio}volume='${insertVolumeExpr}':eval=frame,${UNIFIED_AUDIO_FORMAT}[processed_inserts]`);
      streamsToMix.push('[processed_inserts]');
    }
     else {
      const streamName = audioInputs.baseAudio.replace(/[\[\]]/g, '');
      filters.push(`[${streamName}]anullsink`);
    }

  } else {
    let mainVolumeExpr = '1';
    for (let i = volumeChanges.length - 1; i >= 0; i--) {
      const change = volumeChanges[i];
      if (Math.abs(change.backingVol - 1) > 0.01) {
        mainVolumeExpr = `if(between(t,${change.start},${change.end}),${change.backingVol},${mainVolumeExpr})`;
      }
    }
    filters.push(`${audioInputs.baseAudio}volume='${mainVolumeExpr}':eval=frame,${UNIFIED_AUDIO_FORMAT}[processed_base_a]`);
    streamsToMix.push('[processed_base_a]');
  }

  if (content.backgroundMusic) {
    const totalDurationMs = (content.videoSequenceSegments || []).reduce((sum, seg) => {
      
      return seg.type !== 'cut' ? sum + seg.duration : sum;
    }, 0);
    
    const totalDurationS = msToS(totalDurationMs) || 1;
    const bgm = content.backgroundMusic;
    const bgmInput = `[${mapper.getIndex(bgm.url)}:a]`;
    const bgmVolume = bgm.volume ?? 1;
    filters.push(
      `${bgmInput}aloop=-1:size=2e+09,atrim=duration=${totalDurationS},asetpts=PTS-STARTPTS,volume=${bgmVolume},${UNIFIED_AUDIO_FORMAT}[bgm]`
    );
    streamsToMix.push('[bgm]');
  }

  if (streamsToMix.length > 1) {
    filters.push(
      `${streamsToMix.join('')}amix=inputs=${streamsToMix.length}:duration=longest:dropout_transition=0[final_a]`
    );
    return { audioStream: '[final_a]', filters };
  } else if (streamsToMix.length === 1) {
    return { audioStream: streamsToMix[0], filters };
  } else {
    filters.push(`anullsrc=channel_layout=stereo:sample_rate=44100[final_a]`);
    return { audioStream: '[final_a]', filters };
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
  target: FFmpegTarget,
  scaleFactor: number = 1,
  snapshotInputIndex?: number
): { videoStream: string; filters: string[] } => {
  const filters: string[] = [];
  
  const isWatermarkEnabled = (watermark && watermark.enabled) || !isPremium;
  
  if (watermark && isWatermarkEnabled && snapshotInputIndex !== undefined) {
    const wmStream = '[wm_scaled]';
    const nextV = '[v_with_wm]';
    
    const scaleExpr = `iw*${scaleFactor}*0.5`;
    filters.push(`[${snapshotInputIndex}:v]scale=trunc(${scaleExpr}/2)*2:-1[wm_scaled]`);

    let xStr = '0', yStr = '0';
    
    if (watermark.positionMode === 'custom') {
          xStr = `(W*${watermark.customPosition.x}/100)-(w/2)`;
          yStr = `(H*${watermark.customPosition.y}/100)-(h/2)`;
        } else {
          const margin = 5; // 与前端保持一致的 5% 边距
          
          switch (watermark.position) {
            case 'top-left':
              xStr = `W*${margin}/100`;  // 左边距 5%
              yStr = `H*${margin}/100`;  // 上边距 5%
              break;
            case 'top-right':
              xStr = `W*(100-${margin})/100-w`;  // 右边距 5%
              yStr = `H*${margin}/100`;
              break;
            case 'bottom-left':
              xStr = `W*${margin}/100`;
              yStr = `H*(100-${margin})/100-h`;  // 下边距 5%
              break;
            case 'bottom-right':
              xStr = `W*(100-${margin})/100-w`;
              yStr = `H*(100-${margin})/100-h`;
              break;
            default:
              // 默认右上角
              xStr = `W*(100-${margin})/100-w`;
              yStr = `H*${margin}/100`;
          }
        }

    filters.push(
      `${lastStream}${wmStream}overlay=x='${xStr}':y='${yStr}'${nextV}`
    );
    return { videoStream: nextV, filters };
  }
  
  return { videoStream: lastStream, filters };
};

export const buildMaskTrack = (
  mask: MaskConfig,
  lastStream: string,
  targetW: number,
  targetH: number,
  segments: TimelineSegment[] = []
): { videoStream: string; filters: string[] } => {
  const filters: string[] = [];

  if (!mask || !mask.enabled) {
    return { videoStream: lastStream, filters };
  }

  const safeX = Number.isFinite(mask.x) ? mask.x : 0;
  const safeY = Number.isFinite(mask.y) ? mask.y : 0;
  const safeW = (Number.isFinite(mask.width) && mask.width >= 1) ? mask.width : 20;
  const safeH = (Number.isFinite(mask.height) && mask.height >= 1) ? mask.height : 10;

  const x = Math.floor((safeX / 100) * targetW / 2) * 2;
  const y = Math.floor((safeY / 100) * targetH / 2) * 2;
  const w = Math.floor((safeW / 100) * targetW / 2) * 2;
  const h = Math.floor((safeH / 100) * targetH / 2) * 2;

  if (w <= 0 || h <= 0) {
    return { videoStream: lastStream, filters };
  }

  const maskStream = '[mask_region]';
  const processedStream = '[mask_processed]';
  const nextV = '[v_masked]';

  filters.push(`${lastStream}split[base_for_mask][to_mask]`);
  filters.push(`[to_mask]crop=${w}:${h}:${x}:${y}${maskStream}`);

  let effectFilter = '';
  let tintFilter = '';

  if (mask.mode === 'mosaic') {
    const pixelSize = Math.max(8, mask.intensity * 3);
    effectFilter = `gblur=sigma=2,scale=trunc(iw/${pixelSize}):trunc(ih/${pixelSize}):flags=area,scale=${w}:${h}:flags=neighbor`;
    tintFilter = `,drawbox=t=fill:c=black@0.1`;
  } else {
    const radius = Math.max(2, mask.intensity * 4);
    effectFilter = `avgblur=sizeX=${radius}:sizeY=${radius}`;
    tintFilter = `,drawbox=t=fill:c=white@0.1`;
  }

  filters.push(`${maskStream}${effectFilter}${tintFilter}${processedStream}`);

  const insertRanges: string[] = [];
  segments.forEach(seg => {
    if (seg.type === 'insert') {
      const startS = msToS(seg.globalStartTime);
      const endS = msToS(seg.globalStartTime + seg.duration);
      if (endS > startS) {
        insertRanges.push(`between(t,${startS},${endS})`);
      }
    }
  });

  const enableExpr = insertRanges.length > 0
    ? `:enable='not(${insertRanges.join('+')})'`
    : '';

  filters.push(`[base_for_mask]${processedStream}overlay=${x}:${y}${enableExpr}${nextV}`);

  return { videoStream: nextV, filters };
};