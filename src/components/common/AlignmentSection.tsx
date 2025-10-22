interface AlignmentSectionProps {
  alignment: 'left' | 'center' | 'right';
  verticalAlignment: 'top' | 'center' | 'bottom';
  onChange: (alignment: 'left' | 'center' | 'right', verticalAlignment: 'top' | 'center' | 'bottom') => void;
}

export function AlignmentSection({ alignment, verticalAlignment, onChange }: AlignmentSectionProps) {
  const handleAlignmentClick = (type: 'left' | 'right' | 'top' | 'bottom' | 'center') => {
    switch (type) {
      case 'left':
        onChange('left', verticalAlignment);
        break;
      case 'right':
        onChange('right', verticalAlignment);
        break;
      case 'top':
        onChange(alignment, 'top');
        break;
      case 'bottom':
        onChange(alignment, 'bottom');
        break;
      case 'center':
        onChange('center', 'center');
        break;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-text-primary">对齐</h3>
      
      <div className="flex gap-2">
        {/* 左对齐 */}
        <button
          onClick={() => handleAlignmentClick('left')}
          className={`flex-1 h-9 rounded-lg border transition-all flex items-center justify-center ${
            alignment === 'left'
              ? 'bg-accent-purple border-accent-purple text-white shadow-lg shadow-accent-purple/20'
              : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
          }`}
          title="左对齐"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
          </svg>
        </button>
        
        {/* 居中对齐 */}
        <button
          onClick={() => handleAlignmentClick('center')}
          className={`flex-1 h-9 rounded-lg border transition-all flex items-center justify-center ${
            alignment === 'center' && verticalAlignment === 'center'
              ? 'bg-accent-purple border-accent-purple text-white shadow-lg shadow-accent-purple/20'
              : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
          }`}
          title="居中对齐"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M7 12h10M5 16h14" />
          </svg>
        </button>
        
        {/* 右对齐 */}
        <button
          onClick={() => handleAlignmentClick('right')}
          className={`flex-1 h-9 rounded-lg border transition-all flex items-center justify-center ${
            alignment === 'right'
              ? 'bg-accent-purple border-accent-purple text-white shadow-lg shadow-accent-purple/20'
              : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
          }`}
          title="右对齐"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
          </svg>
        </button>
        
        {/* 上对齐 */}
        <button
          onClick={() => handleAlignmentClick('top')}
          className={`flex-1 h-9 rounded-lg border transition-all flex items-center justify-center ${
            verticalAlignment === 'top'
              ? 'bg-accent-purple border-accent-purple text-white shadow-lg shadow-accent-purple/20'
              : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
          }`}
          title="上对齐"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16M8 8v12M16 8v12" />
          </svg>
        </button>
        
        {/* 下对齐 */}
        <button
          onClick={() => handleAlignmentClick('bottom')}
          className={`flex-1 h-9 rounded-lg border transition-all flex items-center justify-center ${
            verticalAlignment === 'bottom'
              ? 'bg-accent-purple border-accent-purple text-white shadow-lg shadow-accent-purple/20'
              : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
          }`}
          title="下对齐"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4v12M16 4v12M4 20h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}