interface AlignmentSectionProps {
  alignment: 'left' | 'center' | 'right';
  onChange: (alignment: 'left' | 'center' | 'right') => void;
}

export function AlignmentSection({ alignment, onChange }: AlignmentSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-text-primary">对齐</h3>
      
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onChange('left')}
          className={`h-10 rounded-lg border transition-all flex items-center justify-center ${
            alignment === 'left'
              ? 'bg-accent-purple border-accent-purple text-white shadow-lg shadow-accent-purple/20'
              : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
          }`}
          title="左对齐"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
          </svg>
        </button>
        
        <button
          onClick={() => onChange('center')}
          className={`h-10 rounded-lg border transition-all flex items-center justify-center ${
            alignment === 'center'
              ? 'bg-accent-purple border-accent-purple text-white shadow-lg shadow-accent-purple/20'
              : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
          }`}
          title="居中对齐"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
          </svg>
        </button>
        
        <button
          onClick={() => onChange('right')}
          className={`h-10 rounded-lg border transition-all flex items-center justify-center ${
            alignment === 'right'
              ? 'bg-accent-purple border-accent-purple text-white shadow-lg shadow-accent-purple/20'
              : 'bg-bg-tertiary border-border-secondary text-text-secondary hover:border-border-primary'
          }`}
          title="右对齐"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}