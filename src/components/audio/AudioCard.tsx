import { useState, useEffect } from 'react';
import { useAudioStore } from '@/stores/useAudioStore';
import { useSelectedSubtitles } from '@/stores/useUIStore';
import { useProjectStore } from '@/stores/useProjectStore';
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
  const { subtitles, updateSubtitle } = useProjectStore();
  
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

  const getCardStyle = () => {
    if (hasThisAudio) {
      return 'border-orange-500 shadow-lg shadow-orange-500/20';
    }
    if (isApplied) {
      return 'border-green-500 shadow-lg shadow-green-500/20';
    }
    if (isHovering) {
      return 'border-accent-purple';
    }
    return 'border-border-secondary hover:border-border-primary';
  };

  return (
    <button
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      className={`
        relative w-full h-20 rounded-lg border-2 transition-all duration-200
        hover:scale-105 overflow-hidden group bg-bg-secondary
        ${getCardStyle()}
        ${!hasSelectedSubtitles ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
      `}
      disabled={!hasSelectedSubtitles}
    >
      <div className="absolute inset-0 p-3 flex items-center">
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-text-primary truncate mb-1">
            {track.name}
          </div>
          <div className="text-xs text-text-secondary">
            {formatDuration(track.duration)}
          </div>
        </div>
        
        {isCurrentlyPlaying && (
          <div className="flex-shrink-0 ml-2 text-accent-purple">
            🎵
          </div>
        )}
      </div>
      
      {hasThisAudio && (
        <div className="absolute top-1 left-1 w-3 h-3 bg-orange-500 rounded-full" />
      )}

      {isApplied && (
        <div className="absolute top-1 left-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      )}
      
      {!hasSelectedSubtitles && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span className="text-xs text-white">请先选择字幕</span>
        </div>
      )}
    </button>
  );
}