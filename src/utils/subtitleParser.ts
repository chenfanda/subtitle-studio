// src/utils/subtitleParser.ts
import { SubtitleItem, DEFAULT_SUBTITLE_STYLE } from '../types/subtitle';

/**
 * 解析SRT字幕文件内容
 * 支持带说话人标识的格式：[Speaker 0] 文本内容
 */
export function parseSRT(srtContent: string): SubtitleItem[] {
  const subtitles: SubtitleItem[] = [];
  const blocks = srtContent.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;

    try {
      // 第一行：序号
      const id = parseInt(lines[0].trim());
      if (isNaN(id)) continue;

      // 第二行：时间码
      const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      if (!timeMatch) continue;

      const startTime = parseTimeToMs(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
      const endTime = parseTimeToMs(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);

      // 第三行及之后：文本内容（可能多行）
      const textLines = lines.slice(2);
      const fullText = textLines.join('\n').trim();

      // 解析说话人和文本
      const { speaker, text } = parseSpeakerAndText(fullText);

      subtitles.push({
        id: id.toString(), // 转换为字符串类型
        startTime,
        endTime,
        speaker,
        text,
        style: DEFAULT_SUBTITLE_STYLE
      });

    } catch (error) {
      console.warn(`Failed to parse subtitle block: ${block}`, error);
      continue;
    }
  }

  return subtitles.sort((a, b) => a.startTime - b.startTime);
}

/**
 * 将时间转换为毫秒
 */
function parseTimeToMs(hours: string, minutes: string, seconds: string, milliseconds: string): number {
  return (
    parseInt(hours) * 3600000 +
    parseInt(minutes) * 60000 +
    parseInt(seconds) * 1000 +
    parseInt(milliseconds)
  );
}

/**
 * 解析说话人标识和文本内容
 * 格式：[Speaker 0] 文本内容
 */
function parseSpeakerAndText(text: string): { speaker: string | undefined; text: string } {
  const speakerMatch = text.match(/^\[([^\]]+)\]\s*(.*)$/);
  
  if (speakerMatch) {
    return {
      speaker: speakerMatch[1].trim(),
      text: speakerMatch[2].trim()
    };
  }

  return {
    speaker: undefined,
    text: text.trim()
  };
}

/**
 * 将毫秒转换为SRT时间格式
 */
export function msToSRTTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * 根据当前时间获取应该显示的字幕
 */
export function getCurrentSubtitle(subtitles: SubtitleItem[], currentTimeMs: number): SubtitleItem | null {
  return subtitles.find(subtitle => 
    currentTimeMs >= subtitle.startTime && currentTimeMs <= subtitle.endTime
  ) || null;
}

/**
 * 验证SRT文件格式
 */
export function validateSRTFormat(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const blocks = content.trim().split(/\n\s*\n/);

  if (blocks.length === 0) {
    errors.push('SRT文件为空');
    return { isValid: false, errors };
  }

  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].trim().split('\n');
    
    if (lines.length < 3) {
      errors.push(`第${i + 1}个字幕块格式不正确：行数不足`);
      continue;
    }

    // 验证序号
    const id = parseInt(lines[0].trim());
    if (isNaN(id)) {
      errors.push(`第${i + 1}个字幕块：序号格式错误`);
    }

    // 验证时间码
    const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!timeMatch) {
      errors.push(`第${i + 1}个字幕块：时间码格式错误`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}