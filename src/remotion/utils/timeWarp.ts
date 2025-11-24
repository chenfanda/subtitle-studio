import type { TimelineSegment } from '@/types/videoSequence';

export class TimeWarpMap {
  private mappingPoints: { global: number, new: number }[] = [];

  public build(segments: TimelineSegment[]) {
    this.mappingPoints = [];
    let newTimeCursor = 0;

    this.mappingPoints.push({ global: 0, new: 0 });

    segments.forEach(segment => {
      if (segment.type === 'main') {
        // 记录主视频片段的映射关系
        if (segment.sourceStartTime > 0) {
           this.mappingPoints.push({
            global: segment.sourceStartTime,
            new: newTimeCursor,
          });
        }
        
        newTimeCursor += segment.duration;
        
        this.mappingPoints.push({
          global: segment.sourceStartTime + segment.duration,
          new: newTimeCursor,
        });

      } else if (segment.type === 'insert') {
        // 插入片段只增加新时间轴长度，不对应主视频时间点
        newTimeCursor += segment.duration;
      }
    });

    if (this.mappingPoints.length === 0) {
      this.mappingPoints.push({ global: 0, new: 0 });
    }

    this.mappingPoints.sort((a, b) => {
      if (a.global !== b.global) {
        return a.global - b.global;
      }
      return a.new - b.new;
    });
  }

  public getNewTime(globalTime: number): number {
    if (this.mappingPoints.length === 0) {
      return globalTime;
    }

    let p1 = this.mappingPoints[0];
    for (let i = this.mappingPoints.length - 1; i >= 0; i--) {
      if (this.mappingPoints[i].global <= globalTime) {
        p1 = this.mappingPoints[i];
        break;
      }
    }
    
    let p2 = null;
    for (let i = 0; i < this.mappingPoints.length; i++) {
      if (this.mappingPoints[i].global > p1.global || 
         (this.mappingPoints[i].global === p1.global && this.mappingPoints[i].new > p1.new)) 
      {
        p2 = this.mappingPoints[i];
        break;
      }
    }
    
    if (!p2) {
      return p1.new + (globalTime - p1.global);
    }
    
    if (p1.global === p2.global) {
      return p1.new; 
    }
    
    const globalDuration = p2.global - p1.global;
    const newDuration = p2.new - p1.new;

    if (globalDuration === 0) {
      return p1.new;
    }
    
    const offsetPercent = (globalTime - p1.global) / globalDuration;
    
    return p1.new + (offsetPercent * newDuration);
  }
}