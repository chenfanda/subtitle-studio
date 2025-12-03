import { useState, useEffect } from 'react';
import { useAudioStore, useActiveAudioTask, useBackgroundMusic } from '@/stores/useAudioStore';
import { useSelectedSubtitles } from '@/stores/useUIStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { formatDuration } from '@/utils/audioUtils';
import type { AudioTrack } from '@/types/audio';
import { PlayIcon, PauseIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/solid';

interface AudioCardProps {
  track: AudioTrack;
}

export function AudioCard({ track }: AudioCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [hasThisAudio, setHasThisAudio] = useState(false);

  const { 
    previewTrack: currentTrack,   
    isPreviewPlaying: isPlaying, 
    previewCurrentTime: currentTime, 
    playPreview: playAudio,
    pausePreview: pauseAudio,    
    setBackgroundMusic,
    removeBackgroundMusic
  } = useAudioStore();

  const activeAudioTask = useActiveAudioTask();
  const backgroundMusic = useBackgroundMusic();
  const selectedSubtitleIds = useSelectedSubtitles();
  const { subtitles, setSubtitleSoundEffect, removeSubtitleSoundEffect } = useSubtitleStore();

  const hasSelectedSubtitles = selectedSubtitleIds.length > 0;
  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;

  const isBgmMode = activeAudioTask === 'bgm';
  const isSfxMode = activeAudioTask === 'sfx';

  const isActionDisabled = isSfxMode && !hasSelectedSubtitles;

  useEffect(() => {
    let has = false; // 1. 默认值为 false

    if (isBgmMode) { // 2. 检查 BGM 模式
      has = backgroundMusic?.id === track.id;
    } 
    else if (isSfxMode && hasSelectedSubtitles) { // 3. 检查 SFX 模式
      const selectedSubtitle = subtitles.find(s => s.id === selectedSubtitleIds[0]);
      if (selectedSubtitle?.soundEffect) {
        has = selectedSubtitle.soundEffect.track.id === track.id;
      }
    }
    
    setHasThisAudio(has); // 4. 在所有逻辑判断后，只调用一次 set
  }, [
    selectedSubtitleIds, 
    hasSelectedSubtitles, 
    subtitles, 
    track.id, 
    isBgmMode, 
    isSfxMode,
    backgroundMusic
  ]);

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isCurrentlyPlaying) {
      pauseAudio();
    } else {
      playAudio(track);
    }
  };

  const handleApplyAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isActionDisabled) return;

    if (isBgmMode) {
      if (hasThisAudio) {
        removeBackgroundMusic();
      } else {
        setBackgroundMusic(track);
        setIsApplied(true);
        setTimeout(() => setIsApplied(false), 1500);
      }
    }
    else if (isSfxMode) {
      if (!hasThisAudio) {
        selectedSubtitleIds.forEach(subtitleId => {
          setSubtitleSoundEffect(subtitleId, {
            track: track,
            volume: track.volume
          });
        });
        setIsApplied(true);
        setTimeout(() => setIsApplied(false), 1500);
      } else {
        selectedSubtitleIds.forEach(subtitleId => {
          removeSubtitleSoundEffect(subtitleId);
        });
      }
    }
  };

  const showBorder = isHovering || hasThisAudio || isApplied || isCurrentlyPlaying;

  const getBorderColor = () => {
    if (hasThisAudio) return 'border-orange-500';
    if (isApplied) return 'border-green-500';
    if (isHovering || isCurrentlyPlaying) return 'border-accent-purple';
    return 'border-transparent';
  };

  const progressPercentage = (isCurrentlyPlaying && track.duration > 0) 
    ? (currentTime / (track.duration * 1000)) * 100 
    : 0;

  return (
    <div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`
        relative w-full rounded-lg transition-all duration-200
        overflow-hidden group p-2 flex items-center gap-3
        border-2
        ${getBorderColor()}
        ${isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''}
      `}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded bg-bg-tertiary flex items-center justify-center overflow-hidden relative">
        <div className="text-2xl">🎵</div>

        {(isHovering || isCurrentlyPlaying) && (
          <button
            onClick={handlePlayToggle}
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
          >
            {isCurrentlyPlaying ? (
              <PauseIcon className="w-6 h-6 text-white" />
            ) : (
              <PlayIcon className="w-6 h-6 text-white" />
            )}
          </button>
        )}
      </div>

      <div className="flex-1 text-left min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">
          {track.name}
        </div>
        <div className="text-xs text-text-secondary mt-0.5">
          {formatDuration(track.duration)}
        </div>
      </div>

      {(isHovering || hasThisAudio) && !isActionDisabled && (
        <button
          onClick={handleApplyAudio}
          className={`
            absolute right-2 bottom-2 w-4 h-4 rounded flex items-center justify-center
            transition-all duration-200
            ${hasThisAudio
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-accent-purple hover:bg-accent-purple-dark text-white'
            }
          `}
          title={hasThisAudio ? "移除" : "应用"}
        >
          {hasThisAudio ? (
            <MinusIcon className="w-5 h-5" />
          ) : (
            <PlusIcon className="w-5 h-5" />
          )}
        </button>
      )}

      {isApplied && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      )}

      {isCurrentlyPlaying && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-accent-purple" style={{ width: `${progressPercentage}%` }} />
      )}
    </div>
  );
}