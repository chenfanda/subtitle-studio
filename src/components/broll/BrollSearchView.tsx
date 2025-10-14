import { useState } from 'react';
import { useBrollStore } from '@/stores/useBrollStore';
import { BrollLibrary } from './BrollLibrary';
import { BrollLocalView } from './BrollLocalView';

type TabType = 'library' | 'local';

export function BrollSearchView() {
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const { searchBroll } = useBrollStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchBroll(searchQuery.trim());
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 标签切换 */}
      <div className="border-b border-border-secondary px-4 pt-4">
        <div className="flex gap-6 mb-4">
          <button
            onClick={() => setActiveTab('library')}
            className={`
              pb-2 border-b-2 transition-colors text-sm font-medium
              ${activeTab === 'library'
                ? 'border-accent-purple text-accent-purple'
                : 'border-transparent text-text-secondary hover:text-text-primary'
              }
            `}
          >
            素材库
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`
              pb-2 border-b-2 transition-colors text-sm font-medium
              ${activeTab === 'local'
                ? 'border-accent-purple text-accent-purple'
                : 'border-transparent text-text-secondary hover:text-text-primary'
              }
            `}
          >
            本地
          </button>
        </div>
      </div>

      {/* 搜索框（仅在素材库标签显示） */}
      {activeTab === 'library' && (
        <div className="p-4 border-b border-border-secondary">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="搜索 B-roll"
                className="
                  w-full px-3 py-2 pr-10
                  bg-bg-tertiary border border-border-secondary rounded-lg
                  text-text-primary placeholder-text-tertiary
                  focus:outline-none focus:border-accent-purple
                  transition-colors
                "
              />
              <button
                type="submit"
                className="
                  absolute right-2 top-1/2 -translate-y-1/2
                  text-text-tertiary hover:text-accent-purple
                  transition-colors
                "
              >
                🔍
              </button>
            </div>
            
            <select 
              className="
                px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-lg
                text-text-primary focus:outline-none focus:border-accent-purple
                transition-colors
              "
            >
              <option>English</option>
              <option>中文</option>
            </select>
          </form>
        </div>
      )}

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'library' && <BrollLibrary />}
        {activeTab === 'local' && <BrollLocalView />}
      </div>
    </div>
  );
}