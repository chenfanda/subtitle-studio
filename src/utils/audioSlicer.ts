function bufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit 

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // 写入交错数据
  for (i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < buffer.length) {
    for (i = 0; i < numOfChan; i++) {
      // clamp
      sample = Math.max(-1, Math.min(1, channels[i][pos]));
      // scale to 16-bit signed int
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(44 + offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([bufferArr], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

/**
 * 从音频 URL 中截取指定时间段的音频
 * @param audioUrl 音频文件的 URL (例如 audioVocals)
 * @param startTimeMs 开始时间 (毫秒)
 * @param endTimeMs 结束时间 (毫秒)
 * @returns Promise<Blob> 返回 WAV 格式的 Blob
 */
export async function sliceAudioFromUrl(
  audioUrl: string, 
  startTimeMs: number, 
  endTimeMs: number
): Promise<Blob> {
  try {
    
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();

    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const originalBuffer = await audioContext.decodeAudioData(arrayBuffer);

    
    const sampleRate = originalBuffer.sampleRate;
    const startFrame = Math.floor((startTimeMs / 1000) * sampleRate);
    const endFrame = Math.floor((endTimeMs / 1000) * sampleRate);
    const frameCount = endFrame - startFrame;

    if (frameCount <= 0) {
      
      throw new Error(`无效的时间范围: ${startTimeMs}ms - ${endTimeMs}ms`);
    }

    
    const slicedBuffer = audioContext.createBuffer(
      originalBuffer.numberOfChannels,
      frameCount,
      sampleRate
    );

    
    for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
      const originalData = originalBuffer.getChannelData(channel);
      const slicedData = slicedBuffer.getChannelData(channel);
      
      const actualStart = Math.max(0, startFrame);
      const actualEnd = Math.min(originalData.length, endFrame);
      
      
      for (let i = 0; i < (actualEnd - actualStart); i++) {
        slicedData[i] = originalData[actualStart + i];
      }
    }

    
    const wavBlob = bufferToWav(slicedBuffer);
    
    
    audioContext.close();

    return wavBlob;

  } catch (error) {
    console.error('Audio slicing failed:', error);
    throw new Error('无法截取音频片段，请检查源音频是否有效');
  }
}