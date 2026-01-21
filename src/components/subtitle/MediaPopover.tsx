import React, { useEffect, useState, useMemo } from 'react';
import EmojiPicker, { EmojiClickData, EmojiStyle, Theme } from 'emoji-picker-react';
import { Search, X, Loader2, Image as ImageIcon, Smile, Sticker } from 'lucide-react';
import { useMediaStore } from '@/stores/useMediaStore';
import { MediaItem } from '@/types/media';

type TabType = 'emoji' | 'sticker' | 'gif';

interface MediaPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (media: MediaItem) => void;
  position: { x: number; y: number };
}

export function MediaPopover({ isOpen, onClose, onSelectMedia, position }: MediaPopoverProps) {
  const [activeTab, setActiveTab] = useState<TabType>('emoji');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    searchMedia, 
    loadTrending, 
    searchResults, 
    trendingItems, 
    uploadedMedia, 
    presetMedia, 
    loadPresets,
    searchState 
  } = useMediaStore();

  // 当弹窗打开或 Tab 切换时，加载数据
  useEffect(() => {
    if (isOpen) {
      if ((activeTab === 'sticker' || activeTab === 'gif') && !searchQuery) {
        loadTrending(activeTab);
      }
    }
  }, [isOpen, activeTab, loadTrending, searchQuery, loadPresets]);

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchMedia(searchQuery, activeTab as 'sticker' | 'gif');
    }
  };

  // 处理表情点击：将表情转换为 MediaItem (图片贴纸)
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    // 使用 emoji-picker-react 提供的 CDN URL 逻辑
    // 默认使用 Apple 风格 (或者您可以选 Google/Twitter)
    const emojiUrl = emojiData.getImageUrl(EmojiStyle.APPLE);
    
    // 构造一个临时的 MediaItem
    const emojiMediaItem: MediaItem = {
      id: `emoji-${emojiData.unified}-${Date.now()}`,
      url: emojiUrl,
      preview: emojiUrl,
      tags: ['emoji', ...emojiData.names],
      width: 128,  // 默认尺寸
      height: 128,
      type: 'sticker' // 表情视为静态贴纸
    };

    onSelectMedia(emojiMediaItem);
    // 表情通常支持连续点击，这里不关闭弹窗
  };


  const displayItems = useMemo(() => {
    if (activeTab === 'emoji') return [];

    const targetType = activeTab; 
    
    const presetItems = presetMedia.filter(item => item.type === targetType);
    const localItems = uploadedMedia.filter(item => item.type === targetType);
    
    const networkItems = searchQuery ? searchResults : trendingItems;

    const filteredNetworkItems = networkItems.filter(item => item.type === targetType);

    if (searchQuery) {
      return filteredNetworkItems;
    } else {
      return [...presetItems, ...localItems, ...filteredNetworkItems];
    }
  }, [activeTab, searchQuery, uploadedMedia, presetMedia, searchResults, trendingItems]);

  // 渲染内容列表
  const renderContent = () => {
    if (activeTab === 'emoji') {
      return (
        <div className="h-full w-full emoji-container">
          <EmojiPicker 
            onEmojiClick={handleEmojiClick}
            width="100%"
            height={320}
            theme={Theme.DARK} 
            lazyLoadEmojis={true}
            searchDisabled={false}
            emojiStyle={EmojiStyle.APPLE} 
            previewConfig={{ showPreview: false }} 
          />
        </div>
      );
    }

    return (
      <div className="p-2 grid grid-cols-4 gap-2 auto-rows-min">
        {searchState.isLoading ? (
          <div className="col-span-4 flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-accent-purple" />
          </div>
        ) : (
          displayItems.length > 0 ? (
            displayItems.map((item) => (
              <div 
                key={item.id} 
                className="aspect-square relative group cursor-pointer rounded-lg overflow-hidden bg-bg-tertiary flex items-center justify-center p-1 hover:ring-2 hover:ring-accent-purple transition-all"
                onClick={() => {
                  onSelectMedia(item);
                  // 贴纸/动图点击后通常关闭弹窗，或者保留以支持多选，这里选择保留
                }}
              >
                <img 
                  src={item.preview || item.url} 
                  alt="media" 
                  className="max-w-full max-h-full object-contain pointer-events-none" 
                  loading="lazy"
                />
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center text-xs text-text-tertiary py-8">
              暂无内容
            </div>
          )
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  // 计算位置，防止溢出屏幕
  const popoverStyle: React.CSSProperties = {
    top: Math.min(position.y, window.innerHeight - 420),
    left: Math.max(position.x, 10),
    height: '420px'
  };

  return (
    <div 
      className="fixed z-50 w-[340px] bg-bg-primary border border-border-secondary shadow-2xl rounded-xl flex flex-col overflow-hidden"
      style={popoverStyle}
    >
      {/* 头部 Tabs */}
      <div className="flex items-center bg-bg-tertiary border-b border-border-secondary relative">
        {[
          { id: 'emoji', icon: Smile, label: '表情' },
          { id: 'sticker', icon: Sticker, label: '贴纸' },
          { id: 'gif', icon: ImageIcon, label: '动图' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as TabType); setSearchQuery(''); }}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              activeTab === tab.id 
                ? 'text-accent-purple bg-bg-primary border-b-2 border-accent-purple' 
                : 'text-text-tertiary hover:text-text-primary hover:bg-bg-primary/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 p-1 text-text-tertiary hover:text-text-primary rounded-full hover:bg-bg-tertiary"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 搜索栏 (仅针对 Sticker 和 GIF) */}
      {(activeTab === 'sticker' || activeTab === 'gif') && (
        <div className="p-3 border-b border-border-secondary bg-bg-primary">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input 
              type="text" 
              placeholder={`搜索 ${activeTab === 'sticker' ? '贴纸' : '动图'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-tertiary text-text-primary text-xs rounded-md pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent-purple border border-transparent focus:border-accent-purple/50 transition-all"
            />
          </form>
        </div>
      )}

      {/* 内容滚动区 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-bg-primary">
        {renderContent()}
      </div>
    </div>
  );
}