import type { AudioTrack } from '@/types/audio';

export const loadAudioFile = async (url: string): Promise<AudioBuffer> => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return await audioContext.decodeAudioData(arrayBuffer);
};

export const getAudioDuration = async (url: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    audio.addEventListener('error', reject);
    audio.src = url;
  });
};

export const analyzeAudioVolume = async (audioBuffer: AudioBuffer): Promise<number[]> => {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const samplesPerSecond = Math.floor(sampleRate / 10);
  const volumeData: number[] = [];

  for (let i = 0; i < channelData.length; i += samplesPerSecond) {
    let sum = 0;
    const end = Math.min(i + samplesPerSecond, channelData.length);
    
    for (let j = i; j < end; j++) {
      sum += Math.abs(channelData[j]);
    }
    
    volumeData.push(sum / (end - i));
  }

  return volumeData;
};

export const applyFadeEffect = (audioBuffer: AudioBuffer, fadeInSeconds: number, fadeOutSeconds: number): AudioBuffer => {
  const sampleRate = audioBuffer.sampleRate;
  const fadeInSamples = Math.floor(fadeInSeconds * sampleRate);
  const fadeOutSamples = Math.floor(fadeOutSeconds * sampleRate);
  const totalSamples = audioBuffer.length;

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const processedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    totalSamples,
    sampleRate
  );

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = processedBuffer.getChannelData(channel);

    for (let i = 0; i < totalSamples; i++) {
      let gain = 1;

      if (i < fadeInSamples) {
        gain = i / fadeInSamples;
      } else if (i > totalSamples - fadeOutSamples) {
        gain = (totalSamples - i) / fadeOutSamples;
      }

      outputData[i] = inputData[i] * gain;
    }
  }

  return processedBuffer;
};

export const adjustVolume = (audioBuffer: AudioBuffer, volumeLevel: number): AudioBuffer => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const adjustedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = adjustedBuffer.getChannelData(channel);

    for (let i = 0; i < inputData.length; i++) {
      outputData[i] = inputData[i] * volumeLevel;
    }
  }

  return adjustedBuffer;
};

export const trimAudioBuffer = (audioBuffer: AudioBuffer, startTime: number, endTime: number): AudioBuffer => {
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);
  const newLength = endSample - startSample;

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const trimmedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    newLength,
    sampleRate
  );

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = trimmedBuffer.getChannelData(channel);

    for (let i = 0; i < newLength; i++) {
      outputData[i] = inputData[startSample + i] || 0;
    }
  }

  return trimmedBuffer;
};

export const mixAudioTracks = (bgMusic: AudioBuffer, originalAudio: AudioBuffer, bgVolume: number = 0.3): AudioBuffer => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const maxLength = Math.max(bgMusic.length, originalAudio.length);
  const sampleRate = Math.max(bgMusic.sampleRate, originalAudio.sampleRate);

  const mixedBuffer = audioContext.createBuffer(2, maxLength, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const outputData = mixedBuffer.getChannelData(channel);
    const bgData = bgMusic.getChannelData(Math.min(channel, bgMusic.numberOfChannels - 1));
    const originalData = originalAudio.getChannelData(Math.min(channel, originalAudio.numberOfChannels - 1));

    for (let i = 0; i < maxLength; i++) {
      const bgSample = (i < bgData.length) ? bgData[i] * bgVolume : 0;
      const originalSample = (i < originalData.length) ? originalData[i] : 0;
      outputData[i] = bgSample + originalSample;
    }
  }

  return mixedBuffer;
};

export const createAudioPlayer = (track: AudioTrack): HTMLAudioElement => {
  const audio = new Audio(track.url);
  audio.volume = track.volume;
  audio.preload = 'metadata';
  return audio;
};

export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const validateAudioFile = (file: File): boolean => {
  const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  return validTypes.includes(file.type) && file.size <= maxSize;
};

export const generateWaveformData = (audioBuffer: AudioBuffer, width: number = 800): number[] => {
  const channelData = audioBuffer.getChannelData(0);
  const samplesPerPixel = Math.floor(channelData.length / width);
  const waveformData: number[] = [];

  for (let i = 0; i < width; i++) {
    const start = i * samplesPerPixel;
    const end = start + samplesPerPixel;
    let max = 0;

    for (let j = start; j < end; j++) {
      if (j < channelData.length) {
        max = Math.max(max, Math.abs(channelData[j]));
      }
    }

    waveformData.push(max);
  }

  return waveformData;
};