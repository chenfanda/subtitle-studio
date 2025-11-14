import { TimelineRuler } from './TimelineRuler';
import { SubtitleTrack } from './SubtitleTrack';
import { VideoInsertTrack } from './VideoInsertTrack';
import { VoiceoverIdentifierTrack } from './VoiceoverIdentifierTrack';
import { BrollIdentifierTrack } from './BrollIdentifierTrack';
import { SoundEffectIdentifierTrack } from './SoundEffectIdentifierTrack';
import { BackgroundMusicTrack } from './BackgroundMusicTrack';
import { PlayheadIndicator } from './PlayheadIndicator';

export function Timeline() {
  return (
    <div className="h-full bg-bg-primary flex flex-col relative">
      <div className="h-8 flex-shrink-0">
        <TimelineRuler />
      </div>

      <div className="flex-1 overflow-y-auto relative">
        
        <div className="h-9 flex-shrink-0">
          <SubtitleTrack />
        </div>

        <div className="h-9 flex-shrink-0 ">
          <VideoInsertTrack />
        </div>

        <div className="h-9 flex-shrink-0 ">
          <VoiceoverIdentifierTrack />
        </div>

        <div className="h-9 flex-shrink-0 ">
          <BrollIdentifierTrack />
        </div>

        <div className="h-9 flex-shrink-0 ">
          <SoundEffectIdentifierTrack />
        </div>

        <div className="h-9 flex-shrink-0 ">
          <BackgroundMusicTrack />
        </div>

        <div className="flex-1 min-h-[20px]"></div>
      </div>

      <PlayheadIndicator />
    </div>
  );
}