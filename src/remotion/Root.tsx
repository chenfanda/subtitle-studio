import React from 'react';
import { Composition } from 'remotion';
import { VideoComposition } from './VideoComposition';
import type { ProjectExport } from '@/types/project';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        // 🟢 修复：使用 "as any" 绕过严格类型检查
        // 因为我们在下面的 defaultProps 中确实提供了 project 数据，所以这是运行安全的
        component={VideoComposition as any}
        durationInFrames={30 * 10} 
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          project: {
            version: '1.0.0',
            metadata: { 
              title: 'Default Project', 
              createdAt: new Date().toISOString(), 
              modifiedAt: new Date().toISOString() 
            },
            video: { url: '', duration: 10 },
            content: {
              subtitles: [],
              textElements: [],
              placedMedia: [],
              placedBrolls: [],
              backgroundMusic: null,
              videoSequenceSegments: []
            },
            settings: {
              watermark: { enabled: false } as any,
              referenceHeight: 1080
            }
          } as ProjectExport
        }}
      />
    </>
  );
};