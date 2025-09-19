export interface ProjectState {
  id: string;
  title: string;
  videoUrl: string;
  duration: number; // 毫秒
  currentTime: number; // 毫秒
  isPlaying: boolean;
  volume: number; // 0-100
  playbackRate: number; // 0.5, 1, 1.5, 2 等
  lastSaved: Date | null;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
}