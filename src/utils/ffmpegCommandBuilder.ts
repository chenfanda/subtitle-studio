import type { ProjectExport } from '@/types/project';
import type { ExportSettings } from '@/stores/useExportStore';
import type { TimelineSegment } from '@/types/videoSequence';
import { InputMapper, FFmpegTarget, BackendContext } from './ffmpegUtils';
import {
  buildVideoTrack,
  buildAudioTrack,
  buildMediaTrack,
  buildBrollTrack,
  buildTextTrack,
  buildWatermarkTrack,
  buildMaskTrack 
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

const scanProjectInputs = (project: ProjectExport, mapper: InputMapper, context?: BackendContext) => {
  (project.content.videoSequenceSegments || []).forEach(seg => {
    mapper.addInput(seg.sourceUrl, context);
  });

  if (project.content.sourceResources?.audioVocals) {
    mapper.addInput(project.content.sourceResources.audioVocals, context);
  }
  if (project.content.sourceResources?.audioBacking) {
    mapper.addInput(project.content.sourceResources.audioBacking, context);
  }

  (project.content.placedMedia || []).forEach(item => {
    mapper.addInput(item.media.url, context);
  });

  (project.content.subtitles || []).forEach(sub => {
    if (sub.brollVideo) {
      mapper.addInput(sub.brollVideo.video.url, context);
    }
    if (sub.audioTrack) {
      mapper.addInput(sub.audioTrack.track.url, context);
    }
    if (sub.soundEffect) {
      mapper.addInput(sub.soundEffect.track.url, context);
    }
  });

  if (project.content.backgroundMusic) {
    mapper.addInput(project.content.backgroundMusic.url, context);
  }
  (project.content.textElements || []).forEach(el => {
    if ((el as any).snapshotUrl) {
      mapper.addInput((el as any).snapshotUrl, context);
    }
  });
  if (project.settings?.watermark?.enabled && project.settings.watermark.snapshotUrl) {
    mapper.addInput(project.settings.watermark.snapshotUrl, context);
  }
};

const PREVIEW_REFERENCE_HEIGHT = 540;

export const buildFfmpegCommand = (
  project: ProjectExport,
  settings: ExportSettings,
  target: FFmpegTarget,
  isPremium: boolean,
  backendContext?: BackendContext,
  enableHardwareAcceleration: boolean = false
): { command: string[]; mapper: InputMapper } => {
  const mapper = new InputMapper();
  const allVideoFilters: string[] = [];
  const allAudioFilters: string[] = [];

  const timeWarper = new TimeWarpMap();
  timeWarper.build(project.content.videoSequenceSegments);
  const getNewTime = timeWarper.getNewTime.bind(timeWarper);

  scanProjectInputs(project, mapper, backendContext);

  let finalResolution = settings.resolution;
  if (!isPremium && finalResolution > 720) {
    finalResolution = 720;
  }

  const targetH = finalResolution;
  const refHeight = project.settings.referenceHeight || PREVIEW_REFERENCE_HEIGHT;
  const scaleFactor = targetH / refHeight;
  const targetW = Math.round(targetH * 16 / 9) & ~1;

  
  const {
    videoStream: baseVideoStream,
    audioStream: baseAudioStream,
    vocalsStream, 
    backingStream, 
    filters: videoTrackFilters
  } = buildVideoTrack(
    project.content.videoSequenceSegments, 
    project.content.sourceResources, 
    mapper, 
    targetW, 
    targetH
  );
  
  
  videoTrackFilters.forEach(f => {
    if (f.includes('atrim') || f.includes('asetpts') || f.includes('acopy') || (f.includes('concat=n=') && f.includes(':a=1'))) {
      allAudioFilters.push(f);
    } else {
      allVideoFilters.push(f);
    }
  });
  
  let currentStream = baseVideoStream;

  const {
    videoStream: maskStream,
    filters: maskFilters
  } = buildMaskTrack(project.settings.mask, currentStream, targetW, targetH,project.content.videoSequenceSegments);
  
  allVideoFilters.push(...maskFilters);
  currentStream = maskStream; 
  
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
    scaleFactor,
    mapper, 
    targetW 
  );
  allVideoFilters.push(...textFilters);
  currentStream = textStream;

  let snapshotIndex: number | undefined;
  if (project.settings?.watermark?.enabled && project.settings.watermark.snapshotUrl) {
    snapshotIndex = mapper.getIndex(project.settings.watermark.snapshotUrl);
  }

  const {
    videoStream: finalVideoStream,
    filters: watermarkFilters
  } = buildWatermarkTrack(
    project.settings.watermark, 
    isPremium, 
    currentStream, 
    target, 
    scaleFactor,
    snapshotIndex
  );
  allVideoFilters.push(...watermarkFilters);

  
  const {
    audioStream: finalAudioStream,
    filters: audioFilters
  } = buildAudioTrack(
    project.content, 
    { 
      baseAudio: baseAudioStream,
      vocals: vocalsStream,
      backing: backingStream,
    },
    mapper, 
    getNewTime
  );
  allAudioFilters.push(...audioFilters);

  const filterComplex = [...allVideoFilters, ...allAudioFilters].join(';');
  const command = ['-filter_complex', filterComplex];


  command.push(
    '-map', finalVideoStream,
    '-map', finalAudioStream
  );

  if (target === 'backend' && enableHardwareAcceleration) {
    command.push(
      '-c:v', 'h264_nvenc',
      '-preset', 'p4',
      '-cq', '20',
      '-pix_fmt', 'yuv420p',
      '-r', '30'
    );
  } else {
    command.push(
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-r', '30'
    );
  }

  command.push(
    '-c:a', 'aac',
    '-b:a', '128k',
    '-shortest',
    '-f', 'mp4', 'output.mp4'
  );

  return { command: command.filter(Boolean), mapper }};
