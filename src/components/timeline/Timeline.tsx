import { TimelineRuler } from './TimelineRuler';
import { SubtitleTrack } from './SubtitleTrack';
import { AudioIdentifierTrack } from './AudioIdentifierTrack';
import { PlayheadIndicator } from './PlayheadIndicator';

export function Timeline() {
  return (
    <div className="h-full bg-bg-primary flex flex-col relative">
      <div className="h-10 flex-shrink-0">
        <TimelineRuler />
      </div>
      
      <div className="h-12 flex-shrink-0">
        <SubtitleTrack />
      </div>
      
      <div className="h-12 flex-shrink-0 border-t border-gray-700">
        <AudioIdentifierTrack />
      </div>
      
      <div className="flex-1 min-h-[50px]"></div>
      
      <PlayheadIndicator />
    </div>
  );
}