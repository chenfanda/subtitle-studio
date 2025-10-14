import { BrollCard } from './BrollCard';
import { useSearchState } from '@/stores/useBrollStore';

export function BrollLibrary() {
  const { results, isLoading } = useSearchState();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-text-secondary mb-2">搜索中...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple mx-auto"></div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-text-secondary">
          <div className="text-4xl mb-2">🎬</div>
          <div>暂无结果</div>
          <div className="text-sm mt-1">请尝试其他关键词</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {results.map((video) => (
        <BrollCard key={video.id} video={video} />
      ))}
    </div>
  );
}