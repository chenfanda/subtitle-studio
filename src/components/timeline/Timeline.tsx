import { TimelineRuler } from './TimelineRuler';
import { SubtitleTrack } from './SubtitleTrack';
import { VoiceoverIdentifierTrack } from './VoiceoverIdentifierTrack';
import { SoundEffectIdentifierTrack } from './SoundEffectIdentifierTrack';
import { BackgroundMusicTrack } from './BackgroundMusicTrack';
import { PlayheadIndicator } from './PlayheadIndicator';

export function Timeline() {
  return (
    <div className="h-full bg-bg-primary flex flex-col relative">
      {/* 1. 缩小刻度尺高度 */}
      <div className="h-8 flex-shrink-0">
        <TimelineRuler />
      </div>

      {/* 2. 添加一个可垂直滚动的容器 */}
      <div className="flex-1 overflow-y-auto relative">
        
        {/* 3. 缩小所有轨道的高度 */}
        <div className="h-9 flex-shrink-0">
          <SubtitleTrack />
        </div>

        <div className="h-9 flex-shrink-0 ">
          <VoiceoverIdentifierTrack />
        </div>

        <div className="h-9 flex-shrink-0 ">
          <SoundEffectIdentifierTrack />
        </div>

        <div className="h-9 flex-shrink-0 ">
          <BackgroundMusicTrack />
        </div>

        {/* 您未来可以添加更多轨道在这里... */}

        <div className="flex-1 min-h-[20px]"></div>
      </div>

      <PlayheadIndicator />
    </div>
  );
}