export interface KaraokeWord {
  text: string;
  startTime: number;
  endTime: number;
  characters: KaraokeChar[];
}

export interface KaraokeChar {
  char: string;
  startTime: number;
  endTime: number;
  index: number;
}

export function getKaraokeTimings(text: string, durationMs: number): KaraokeWord[] {
  if (!text || durationMs <= 0) return [];

  const tokenRegex = /[a-zA-Z0-9']+|[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g;
  const tokens: { word: string; index: number }[] = [];
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    tokens.push({ word: match[0], index: match.index });
  }

  if (tokens.length === 0) {
    return [{
      text,
      startTime: 0,
      endTime: durationMs,
      characters: splitToCharacters(text, 0, durationMs)
    }];
  }

  const weights = tokens.map(t => Math.max(t.word.length, 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const timePerWeight = durationMs / totalWeight;

  const result: KaraokeWord[] = [];
  let currentStartTime = 0;

  for (let i = 0; i < tokens.length; i++) {
    const currentToken = tokens[i];
    const nextToken = tokens[i + 1];
    const chunkStart = currentToken.index;
    const chunkEnd = nextToken ? nextToken.index : text.length;
    const chunkText = text.substring(chunkStart, chunkEnd);

    const wordDuration = Math.round(weights[i] * timePerWeight);
    const wordEndTime = Math.min(currentStartTime + wordDuration, durationMs);

    result.push({
      text: chunkText,
      startTime: currentStartTime,
      endTime: wordEndTime,
      characters: splitToCharacters(chunkText, currentStartTime, wordEndTime)
    });

    currentStartTime = wordEndTime;
  }

  if (tokens[0].index > 0) {
    const prefix = text.substring(0, tokens[0].index);
    result[0].text = prefix + result[0].text;
    result[0].characters = splitToCharacters(result[0].text, result[0].startTime, result[0].endTime);
  }

  if (result.length > 0) {
    result[result.length - 1].endTime = durationMs;
  }

  return result;
}

function splitToCharacters(text: string, startTime: number, endTime: number): KaraokeChar[] {
  // Check if the text block contains alphanumeric characters (likely an English word)
  // If so, we treat the entire block as a single unit to achieve word-by-word animation
  if (/[a-zA-Z0-9']/.test(text)) {
    return [{
      char: text,
      startTime: Math.round(startTime),
      endTime: Math.round(endTime),
      index: 0
    }];
  }

  const chars = Array.from(text);
  const duration = endTime - startTime;
  const timePerChar = duration / Math.max(chars.length, 1);

  return chars.map((char, i) => ({
    char,
    startTime: Math.round(startTime + i * timePerChar),
    endTime: Math.round(startTime + (i + 1) * timePerChar),
    index: i
  }));
}

export function getActiveWordIndex(timings: KaraokeWord[], currentTimeMs: number): number {
  return timings.findIndex(t => currentTimeMs >= t.startTime && currentTimeMs < t.endTime);
}

export function getWordAnimationProgress(timings: KaraokeWord[], currentTimeMs: number): number {
  if (timings.length === 0) return 0;
  const index = getActiveWordIndex(timings, currentTimeMs);
  if (index === -1) return currentTimeMs >= timings[timings.length - 1]?.endTime ? 1 : 0;

  const word = timings[index];
  const progress = (currentTimeMs - word.startTime) / (word.endTime - word.startTime);
  return Math.max(0, Math.min(1, progress));
}

export function getCharacterStaggerDelay(word: KaraokeWord, baseDelayMs: number = 50): number[] {
  return word.characters.map((_, i) => i * baseDelayMs);
}

export function getGlobalWipeProgress(durationMs: number, currentTimeMs: number): number {
  return Math.max(0, Math.min(1, currentTimeMs / durationMs));
}