import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';
import { useProjectStore } from '@/stores/useProjectStore';
// 1. (已修正) 从 lucide-react 导入 ListVideo
import { Trash2, Clock, Link2, ListVideo } from 'lucide-react';

/**
 * (工具函数) 将毫秒格式化为 00:00.000
 * 我们在此处本地定义，以避免依赖未知的 "utils" 模块。
 */
function formatTime(ms: number): string {
  const seconds = ms / 1000;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(3).padStart(6, '0')}`;
}

/**
 * ClipsPanel 的 "视频序列" 模式的列表。
 * 显示所有已添加的 VideoInsertClip 片段。
 */
export function VideoSequenceList() {
  const { clips, removeClip } = useVideoSequenceStore();
  const { setCurrentTime } = useProjectStore();

  const handleItemClick = (insertAtTimeMs: number) => {
    // useProjectStore 和 SubtitleToolbar 使用秒
    setCurrentTime(insertAtTimeMs / 1000);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    // 阻止事件冒泡，以免触发 handleItemClick
    e.stopPropagation();
    
    // 调用 store action 删除片段
    removeClip(id);
  };

  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-text-secondary">
        {/* 2. (已修正) 此图标现在可以正确导入 */}
        <ListVideo size={32} className="mb-2" />
        <p className="text-sm">尚未添加视频插入片段</p>
        <p className="text-xs mt-1">
          点击上方的 "添加视频插入" 按钮
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-2 gap-2">
      {clips.map((clip, index) => (
        <div
          key={clip.id}
          onClick={() => handleItemClick(clip.insertAtTime)}
          className="
            group p-3 rounded-lg border border-border-secondary 
            bg-bg-primary hover:bg-bg-tertiary 
            cursor-pointer transition-colors
          "
        >
          {/* 顶部：索引和删除按钮 */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-text-primary">
              片段 #{index + 1}
            </span>
            <button
              onClick={(e) => handleDeleteClick(e, clip.id)}
              className="
                p-1 rounded text-text-secondary hover:text-accent-red 
                hover:bg-accent-red/10 transition-colors
                opacity-0 group-hover:opacity-100
              "
              aria-label="删除片段"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* 信息：URL */}
          <div className="flex items-center gap-1.5 text-text-secondary text-xs mb-1">
            <Link2 size={12} />
            <span className="truncate" title={clip.sourceUrl}>
              {clip.sourceUrl}
            </span>
          </div>
          
          {/* 信息：时间 */}
          <div className="flex items-center gap-1.5 text-text-secondary text-xs">
            <Clock size={12} />
            <span>
              插入于 {formatTime(clip.insertAtTime)}
            </span>
            <span className="text-text-tertiary">|</span>
            <span>
              时长 {formatTime(clip.duration)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}