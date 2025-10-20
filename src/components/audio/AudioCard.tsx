import { useState, useEffect } from 'react';
import { useAudioStore } from '@/stores/useAudioStore';
import { useSelectedSubtitles } from '@/stores/useUIStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { formatDuration } from '@/utils/audioUtils';
import type { AudioTrack } from '@/types/audio';

interface AudioCardProps {
  track: AudioTrack;
}

export function AudioCard({ track }: AudioCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [hasThisAudio, setHasThisAudio] = useState(false);
  
  const { 
    currentTrack, 
    isPlaying, 
    playAudio, 
    pauseAudio 
  } = useAudioStore();
  const selectedSubtitleIds = useSelectedSubtitles();
  const { subtitles, updateSubtitle } = useSubtitleStore();
  
  const hasSelectedSubtitles = selectedSubtitleIds.length > 0;
  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
  
  useEffect(() => {
    if (!hasSelectedSubtitles) {
      setHasThisAudio(false);
      return;
    }

    const selectedSubtitle = subtitles.find(s => s.id === selectedSubtitleIds[0]);
    if (selectedSubtitle?.audioTrack) {
      setHasThisAudio(selectedSubtitle.audioTrack.track.id === track.id);
    } else {
      setHasThisAudio(false);
    }
  }, [selectedSubtitleIds, hasSelectedSubtitles, subtitles, track.id]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (!isCurrentlyPlaying) {
      playAudio(track);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (isCurrentlyPlaying) {
      pauseAudio();
    }
  };

  const handleCardClick = () => {
    if (!hasSelectedSubtitles) return;
    
    if (!hasThisAudio) {
      selectedSubtitleIds.forEach(subtitleId => {
        updateSubtitle(subtitleId, {
          audioTrack: {
            track,
            volume: track.volume,
            fadeIn: track.fadeIn,
            fadeOut: track.fadeOut
          }
        });
      });
      
      setIsApplied(true);
      setTimeout(() => setIsApplied(false), 1500);
    } else {
      selectedSubtitleIds.forEach(subtitleId => {
        updateSubtitle(subtitleId, {
          audioTrack: undefined
        });
      });
      setHasThisAudio(false);
    }
  };

  const showBorder = isHovering || hasThisAudio || isApplied;

  const getBorderColor = () => {
    if (hasThisAudio) return 'border-orange-500';
    if (isApplied) return 'border-green-500';
    if (isHovering) return 'border-accent-purple';
    return '';
  };

  return (
    <button
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      className={`
        relative w-full rounded-lg transition-all duration-200
        overflow-hidden group p-2 flex items-center gap-3
        ${showBorder ? `border-2 ${getBorderColor()}` : 'border-0'}
        ${!hasSelectedSubtitles ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
      `}
      disabled={!hasSelectedSubtitles}
    >
      <div className="flex-shrink-0 w-16 h-16 rounded bg-bg-tertiary flex items-center justify-center overflow-hidden">
        <div className="text-2xl">🎵</div>
      </div>
      
      <div className="flex-1 text-left min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">
          {track.name}
        </div>
        <div className="text-xs text-text-secondary mt-0.5">
          {formatDuration(track.duration)}
        </div>
      </div>
      
      {hasThisAudio && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full" />
      )}

      {isApplied && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      )}
      
      {!hasSelectedSubtitles && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
          <span className="text-xs text-white">请先选择字幕</span>
        </div>
      )}
    </button>
  );
}