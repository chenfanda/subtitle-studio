import { useMemo, useState, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useSubtitleStore } from '@/stores/useSubtitleStore';
import { useTimelineStore } from '@/stores/useTimelineStore';

export function AudioWaveform() {
  const { duration, currentTime, isPlaying } = useProjectStore();
  const { subtitles } = useSubtitleStore();
  const { pixelsPerSecond, scrollPosition } = useTimelineStore();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 50);
    
    return () => clearInterval(interval);
  }, [isPlaying]);
  
  const waveformData = useMemo(() => {
    if (!duration) return [];
    
    const bars = [];
    const barWidth = 3;
    const spacing = 1;
    const totalBars = Math.floor((duration * pixelsPerSecond) / (barWidth + spacing));
    
    const hasAudioAt = new Array(totalBars).fill(false);
    
    subtitles.forEach(subtitle => {
      const startBar = Math.floor((subtitle.startTime / 1000) * pixelsPerSecond / (barWidth + spacing));
      const endBar = Math.floor((subtitle.endTime / 1000) * pixelsPerSecond / (barWidth + spacing));
      
      for (let i = startBar; i <= endBar && i < totalBars; i++) {
        hasAudioAt[i] = true;
      }
    });
    
    for (let i = 0; i < totalBars; i++) {
      const x = i * (barWidth + spacing);
      const hasAudio = hasAudioAt[i];
      
      bars.push({
        x,
        baseHeight: hasAudio ? 15 + Math.random() * 25 : 3 + Math.random() * 4,
        hasAudio
      });
    }
    
    return bars;
  }, [duration, pixelsPerSecond, subtitles]);

  return (
    <div className="h-full bg-bg-primary relative overflow-hidden">
      <div 
        className="relative h-full w-full flex items-center"
        style={{ transform: `translateX(-${scrollPosition}px)` }}
      >
        {waveformData.map((bar, index) => {
          const timeAtBar = bar.x / pixelsPerSecond;
          const isPlayed = timeAtBar < currentTime;
          const distanceFromPlayhead = Math.abs(timeAtBar - currentTime);
          const isNearPlayhead = distanceFromPlayhead < 2;
          
          let height = bar.baseHeight;
          if (isPlaying && isNearPlayhead && bar.hasAudio) {
            const wave = Math.sin((tick * 0.3) + (index * 0.1)) * 2;
            height = Math.max(3, bar.baseHeight + wave);
          }
          
          let color = '#6b7280';
          let opacity = 0.6;
          
          if (bar.hasAudio) {
            if (isPlayed) {
              color = '#3b82f6';
              opacity = isNearPlayhead && isPlaying ? 0.9 : 0.7;
            } else {
              color = '#9ca3af';
              opacity = 0.8;
            }
          } else {
            if (isPlayed) {
              color = '#3b82f6';
              opacity = 0.3;
            }
          }
          
          return (
            <div
              key={index}
              className="absolute rounded-sm"
              style={{
                left: bar.x,
                top: '50%',
                width: '3px',
                height: `${height}px`,
                backgroundColor: color,
                opacity,
                transform: 'translateY(-50%)',
                transition: isPlaying ? 'opacity 0.1s ease' : 'all 0.2s ease'
              }}
            />
          );
        })}
        
        {isPlaying && (
          <>
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                left: (currentTime * pixelsPerSecond) - 15,
                top: '50%',
                width: '30px',
                height: '60px',
                background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
                transform: 'translateY(-50%)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}