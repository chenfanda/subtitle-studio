import type { ProjectExport } from '@/types/project';
import type { ExportSettings } from '@/stores/useExportStore';
import type { TimelineSegment } from '@/types/videoSequence';
import { InputMapper, FFmpegTarget} from './ffmpegUtils';
import {
  buildVideoTrack,
  buildAudioTrack,
  buildMediaTrack,
  buildBrollTrack,
  buildTextTrack,
  buildWatermarkTrack
} from './ffmpegFilterBuilder';

class TimeWarpMap {
  private mappingPoints: { global: number, new: number }[] = [];

  public build(segments: TimelineSegment[]) {
    this.mappingPoints = [];
    let newTimeCursor = 0;

    this.mappingPoints.push({ global: 0, new: 0 });

    segments.forEach(segment => {
      if (segment.type === 'main') {
        if (segment.sourceStartTime > 0) {
           this.mappingPoints.push({
            global: segment.sourceStartTime,
            new: newTimeCursor,
          });
        }
        
        newTimeCursor += segment.duration;
        
        this.mappingPoints.push({
          global: segment.sourceStartTime + segment.duration,
          new: newTimeCursor,
        });

      } else if (segment.type === 'insert') {
        newTimeCursor += segment.duration;
      }
    });

    if (this.mappingPoints.length === 0) {
      this.mappingPoints.push({ global: 0, new: 0 });
    }

    this.mappingPoints.sort((a, b) => {
      if (a.global !== b.global) {
        return a.global - b.global;
      }
      return a.new - b.new;
    });
  }

  public getNewTime(globalTime: number): number {
    if (this.mappingPoints.length === 0) {
      return globalTime;
    }

    let p1 = this.mappingPoints[0];
    for (let i = this.mappingPoints.length - 1; i >= 0; i--) {
      if (this.mappingPoints[i].global <= globalTime) {
        p1 = this.mappingPoints[i];
        break;
      }
    }
    
    let p2 = null;
    for (let i = 0; i < this.mappingPoints.length; i++) {
      if (this.mappingPoints[i].global > p1.global || 
         (this.mappingPoints[i].global === p1.global && this.mappingPoints[i].new > p1.new)) 
      {
        p2 = this.mappingPoints[i];
        break;
      }
    }
    
    if (!p2) {
      return p1.new + (globalTime - p1.global);
    }
    
    if (p1.global === p2.global) {
      return p1.new; 
    }
    
    const globalDuration = p2.global - p1.global;
    const newDuration = p2.new - p1.new;

    if (globalDuration === 0) {
      return p1.new;
    }
    
    const offsetPercent = (globalTime - p1.global) / globalDuration;
    
    return p1.new + (offsetPercent * newDuration);
  }
}

const scanProjectInputs = (project: ProjectExport, mapper: InputMapper) => {
  (project.content.videoSequenceSegments || []).forEach(seg => {
    mapper.addInput(seg.sourceUrl);
  });

  (project.content.placedMedia || []).forEach(item => {
    mapper.addInput(item.media.url);
  });

  (project.content.subtitles || []).forEach(sub => {
    if (sub.brollVideo) {
      mapper.addInput(sub.brollVideo.video.url);
    }
    if (sub.audioTrack) {
      mapper.addInput(sub.audioTrack.track.url);
    }
    if (sub.soundEffect) {
      mapper.addInput(sub.soundEffect.track.url);
    }
  });

  if (project.content.backgroundMusic) {
    mapper.addInput(project.content.backgroundMusic.url);
  }
};

const PREVIEW_REFERENCE_HEIGHT = 540;

export const buildFfmpegCommand = (
  project: ProjectExport,
  settings: ExportSettings,
  target: FFmpegTarget,
  isPremium: boolean
): { command: string[]; mapper: InputMapper } => {
  const mapper = new InputMapper();
  const allVideoFilters: string[] = [];
  const allAudioFilters: string[] = [];

  const timeWarper = new TimeWarpMap();
  timeWarper.build(project.content.videoSequenceSegments);
  const getNewTime = timeWarper.getNewTime.bind(timeWarper);

  scanProjectInputs(project, mapper);

  let finalResolution = settings.resolution;
  if (!isPremium && finalResolution > 720) {
    finalResolution = 720;
  }
  const isGif = settings.format === 'gif';
  const targetH = finalResolution;
  const refHeight = project.settings.referenceHeight || PREVIEW_REFERENCE_HEIGHT;
  const scaleFactor = targetH / refHeight;
  const targetW = Math.round(targetH * 16 / 9) & ~1;

  const {
    videoStream: baseVideoStream,
    audioStream: baseAudioStream,
    filters: videoTrackFilters
  } = buildVideoTrack(project.content.videoSequenceSegments, mapper, targetW, targetH);
  
  videoTrackFilters.forEach(f => {
    if (f.includes('atrim') || f.includes('asetpts') || (f.includes('concat=n=') && f.includes(':a=1'))) {
      allAudioFilters.push(f);
    } else {
      allVideoFilters.push(f);
    }
  });
  
  let currentStream = baseVideoStream;

  const {
    videoStream: mediaStream,
    filters: mediaFilters
  } = buildMediaTrack(
    project.content.placedMedia, 
    currentStream, 
    mapper, 
    getNewTime, 
    targetW, 
    targetH,
    scaleFactor
  );
  allVideoFilters.push(...mediaFilters);
  currentStream = mediaStream;

  const {
    videoStream: brollStream,
    filters: brollFilters,
    brollRanges
  } = buildBrollTrack(project.content.subtitles, currentStream, mapper, getNewTime);
  allVideoFilters.push(...brollFilters);
  currentStream = brollStream;

  const {
    videoStream: textStream,
    filters: textFilters
  } = buildTextTrack(
    project.content, 
    brollRanges, 
    project.content.videoSequenceSegments,
    currentStream, 
    target, 
    getNewTime,
    scaleFactor
  );
  allVideoFilters.push(...textFilters);
  currentStream = textStream;

  const {
    videoStream: finalVideoStream,
    filters: watermarkFilters
  } = buildWatermarkTrack(project.settings.watermark, isPremium, currentStream, target);
  allVideoFilters.push(...watermarkFilters);

  const {
    audioStream: finalAudioStream,
    filters: audioFilters
  } = buildAudioTrack(project.content, baseAudioStream, mapper, getNewTime);
  allAudioFilters.push(...audioFilters);

  const filterComplex = [...allVideoFilters, ...allAudioFilters].join(';');
  const command = ['-filter_complex', filterComplex];

  if (isGif) {
    const gifFilters = `${filterComplex};${finalVideoStream}split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse[v_gif_out]`;
    command[1] = gifFilters;
    command.push(
      '-map', '[v_gif_out]', '-an', '-f', 'gif', 'output.gif'
    );
  } else {
    command.push(
      '-map', finalVideoStream,
      '-map', finalAudioStream,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-r', '30',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-shortest',
      '-f', 'mp4', 'output.mp4'
    );
  }

  return { command: command.filter(Boolean), mapper };
};