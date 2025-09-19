// src/components/timeline/Timeline.tsx
import { TimelineRuler } from './TimelineRuler';
import { AudioWaveform } from './AudioWaveform';
import { SubtitleTrack } from './SubtitleTrack';
import { PlayheadIndicator } from './PlayheadIndicator';

export function Timeline() {
  return (
    <div className="h-full bg-bg-primary flex flex-col relative">
      {/* 时间刻度标尺 */}
      <div className="h-10 flex-shrink-0">
        <TimelineRuler />
      </div>
      
      {/* 字幕轨道 - 无边框，一体化 */}
      <div className="h-12 flex-shrink-0">
        <SubtitleTrack />
      </div>
      
      {/* 音频波形 - 无边框，流畅衔接 */}
      <div className="flex-1 min-h-[100px]">
        <AudioWaveform />
      </div>
      
      {/* 播放指示器 - 跨越所有轨道 */}
      <PlayheadIndicator />
    </div>
  );
}