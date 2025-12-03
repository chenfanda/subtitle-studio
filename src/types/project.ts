import type { TimelineSegment } from './videoSequence';

export interface SourceResources {
  video: string;        
  audioVocals: string;
  audioBacking: string;
}

export interface AudioMix {
  originalVocalVolume: number; 
  backingVolume: number;
  mainVideoVolume?: number;        
}

export interface ProjectState {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  currentTime: number;
  sourceResources: SourceResources | null;
  audioMix: AudioMix;
  globalTime: number;
  globalDuration: number;
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  lastSaved: Date | null;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  editorHeight: number;
}

export interface ProjectExport {
  version: string;
  metadata: {
    title: string;
    createdAt: string;
    modifiedAt: string;
  };
  video: {
    url: string;
    duration: number;
  };
  content: {
    subtitles: any[];         
    textElements: any[];      
    placedMedia: any[];       
    placedBrolls: any[];     
    backgroundMusic: any | null;  
    videoSequenceSegments: TimelineSegment[];
    sourceResources?: SourceResources;
    audioMix?: AudioMix;
  };
  settings: {
    watermark: any;
    referenceHeight?: number;          
  };
}

export interface ProjectLoadOptions {
  clearHistory?: boolean;
  resetUI?: boolean;
}

export interface ProjectExportOptions {
  includeVideoUrl?: boolean;
  minify?: boolean;
}

export const DEFAULT_AUDIO_MIX: AudioMix = {
  originalVocalVolume: 1,
  backingVolume: 1,
  mainVideoVolume: 1,
};