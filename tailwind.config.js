
// ============ tailwind.config.js ============
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 背景色系
        'bg-primary': '#1a1a1a',
        'bg-secondary': '#2a2a2a',
        'bg-tertiary': '#3a3a3a',
        'bg-elevated': '#404040',
        
        // 文字色系
        'text-primary': '#ffffff',
        'text-secondary': '#d1d5db',
        'text-tertiary': '#9ca3af',
        'text-disabled': '#6b7280',
        
        // 主题色
        'accent-purple': '#8b5cf6',
        'accent-blue': '#3b82f6',
        'accent-green': '#10b981',
        'accent-red': '#ef4444',
        'accent-yellow': '#f59e0b',
        
        // 边框色
        'border-primary': '#4a4a4a',
        'border-secondary': '#3a3a3a',
      },
      fontFamily: {
        'primary': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
        'chinese': ['Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '300ms',
        'slow': '500ms',
      },
      spacing: {
        '15': '60px',
        '18': '72px',
        '45': '180px',
      }
    },
  },
  plugins: [],
}