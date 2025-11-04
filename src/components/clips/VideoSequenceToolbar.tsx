import { Plus } from 'lucide-react';
import { useVideoSequenceStore } from '@/stores/useVideoSequenceStore';
import { useProjectStore } from '@/stores/useProjectStore';

/**
 * "视频序列" 模式的工具栏。
 * 包含 "添加视频插入" 按钮。
 */
export function VideoSequenceToolbar() {
  const { addClip } = useVideoSequenceStore();
  const { currentTime } = useProjectStore();

  const handleAddVideoInsert = () => {
    // TODO: 替换为媒体选择对话框 (例如 BrollDialog)
    
    // 这是一个临时的占位符，用于获取视频信息
    const sourceUrl = window.prompt("请输入要插入的视频 URL:");
    if (!sourceUrl) {
      return; // 用户取消
    }

    const durationStr = window.prompt("请输入视频时长 (秒):", "5");
    const durationSec = parseFloat(durationStr || "5");
    if (isNaN(durationSec) || durationSec <= 0) {
      alert("无效的时长");
      return;
    }

    // 从 useProjectStore 获取的 currentTime 是秒
    // 我们的 store (如 useSubtitleStore) 和 useVideoSequenceStore 使用毫秒
    const insertAtTimeMs = currentTime * 1000;
    const durationMs = durationSec * 1000;

    addClip({
      sourceUrl: sourceUrl,
      insertAtTime: insertAtTimeMs,
      duration: durationMs,
    });
  };

  return (
    <div className="p-2 border-b border-border-secondary bg-bg-primary">
      <button
        onClick={handleAddVideoInsert}
        className="
          flex items-center justify-center gap-1.5 w-full p-2 rounded-md
          text-sm font-medium transition-colors
          bg-accent-purple text-white hover:bg-accent-purple/80
        "
      >
        <Plus size={16} />
        <span>添加视频插入</span>
      </button>
    </div>
  );
}