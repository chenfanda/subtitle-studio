import { useState } from 'react';
import { useMediaStore } from '@/stores/useMediaStore';

export function MediaSearch() {
  const [query, setQuery] = useState('');
  const { 
    activeMediaType, 
    searchState, 
    searchHistory,
    searchMedia, 
    clearSearch,
    clearHistory 
  } = useMediaStore();

  const handleSearch = () => {
    if (query.trim()) {
      searchMedia(query.trim(), activeMediaType);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    searchMedia(historyQuery, activeMediaType);
  };

  const handleClear = () => {
    setQuery('');
    clearSearch();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`搜索${activeMediaType === 'sticker' ? '贴纸' : 'GIF'}...`}
            className="w-full px-3 py-2 text-sm bg-bg-tertiary border border-border-secondary rounded text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-purple"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            >
              ✕
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={!query.trim() || searchState.isLoading}
          className="px-4 py-2 text-sm bg-accent-purple hover:bg-accent-purple/80 disabled:bg-accent-purple/50 text-white rounded transition-colors"
        >
          {searchState.isLoading ? '...' : '搜索'}
        </button>
      </div>

      {searchHistory.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">搜索历史</span>
            <button
              onClick={clearHistory}
              className="text-xs text-text-tertiary hover:text-text-primary"
            >
              清空
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.slice(0, 5).map((historyQuery) => (
              <button
                key={historyQuery}
                onClick={() => handleHistoryClick(historyQuery)}
                className="px-2 py-1 text-xs bg-bg-secondary hover:bg-bg-elevated text-text-secondary hover:text-text-primary rounded transition-colors"
              >
                {historyQuery}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}