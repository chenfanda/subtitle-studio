import { useBrollStore } from '@/stores/useBrollStore';
import type { BrollTransition } from '@/types/broll';

const transitions: Array<{
  type: BrollTransition;
  label: string;
  icon: string;
}> = [
  { type: 'none', label: '无', icon: '⊗' },
  { type: 'fade', label: '淡入', icon: '◐' },
  { type: 'glow', label: '光晕', icon: '✦' },
];

export function BrollTransitionSelector() {
  const { selectedTransition, selectTransition } = useBrollStore();

  return (
    <div className="space-y-3">
      {/* 标题 */}
      <div className="text-sm font-medium text-text-primary">过渡动画</div>
      
      {/* 预览卡片 - 可点击选择 */}
      <div className="grid grid-cols-3 gap-3">
        {transitions.map((transition) => (
          <button
            key={transition.type}
            onClick={() => selectTransition(transition.type)}
            className={`
              relative aspect-video rounded-lg overflow-hidden
              border-2 transition-all duration-200
              ${selectedTransition === transition.type
                ? 'border-accent-purple shadow-lg shadow-accent-purple/20'
                : 'border-border-secondary hover:border-border-primary'
              }
            `}
          >
            {/* 预览背景图 */}
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex flex-col items-center justify-center">
              {/* 图标 */}
              <span className="text-3xl mb-1">{transition.icon}</span>
              {/* 文字标签 */}
              <span className="text-xs text-gray-300">{transition.label}</span>
            </div>
            
            {/* 选中状态标记 */}
            {selectedTransition === transition.type && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-accent-purple rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}