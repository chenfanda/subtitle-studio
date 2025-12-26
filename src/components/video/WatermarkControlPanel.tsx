import React, { useRef } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { 
  Upload, X, Type, Image as ImageIcon,
  AlignStartVertical, AlignEndVertical, 
  AlignStartHorizontal, AlignEndHorizontal, 
  Layers,
  Bold, Italic, Underline
} from 'lucide-react';
import type { WatermarkLayoutMode } from '@/types/settings';
import { FONT_OPTIONS } from '@/constants/fonts';

export function WatermarkControlPanel() {
  const { watermark, updateWatermark } = useSettingsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentLayout = watermark.layout || 'row';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        updateWatermark({ imageUrl: event.target.result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const LayoutButton = ({ mode, icon: Icon, title }: { mode: WatermarkLayoutMode, icon: any, title: string }) => (
    <button
      onClick={() => updateWatermark({ layout: mode })}
      className={`p-1.5 rounded transition-colors ${
        currentLayout === mode 
          ? 'bg-accent-purple text-white shadow-sm' 
          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
      }`}
      title={title}
    >
      <Icon size={16} />
    </button>
  );

  const toggleBold = () => {
    const currentWeight = watermark.fontWeight || 400;
    updateWatermark({ fontWeight: currentWeight >= 600 ? 400 : 700 });
  };

  const toggleItalic = () => {
    const currentStyle = watermark.fontStyle || 'normal';
    updateWatermark({ fontStyle: currentStyle === 'italic' ? 'normal' : 'italic' });
  };

  const toggleUnderline = () => {
    const currentDecoration = watermark.textDecoration || 'none';
    updateWatermark({ textDecoration: currentDecoration.includes('underline') ? 'none' : 'underline' });
  };

  return (
    <div 
      className="w-72 p-4 space-y-4 select-none text-white max-h-[80vh] overflow-y-auto custom-scrollbar"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <h3 className="text-sm font-medium">水印设置</h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer"
            checked={watermark.enabled}
            onChange={(e) => updateWatermark({ enabled: e.target.checked })}
          />
          <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-purple"></div>
        </label>
      </div>

      {watermark.enabled && (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
          
          <div className="space-y-2">
             <div className="text-xs text-gray-400">图文排版</div>
             <div className="flex justify-between bg-black/20 p-1 rounded-lg">
               <LayoutButton mode="row" icon={AlignStartVertical} title="左图右文" />
               <LayoutButton mode="row-reverse" icon={AlignEndVertical} title="右图左文" />
               <LayoutButton mode="col" icon={AlignStartHorizontal} title="上图下文" />
               <LayoutButton mode="col-reverse" icon={AlignEndHorizontal} title="下图上文" />
               <LayoutButton mode="overlay" icon={Layers} title="文字叠加在图片上" />
             </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1"><ImageIcon size={12}/> 图片/Logo</span>
            </div>
            
            <div className="relative group rounded-lg overflow-hidden border border-white/10 bg-black/40 h-20 flex items-center justify-center">
              {watermark.imageUrl ? (
                <>
                  <img src={watermark.imageUrl} alt="Preview" className="h-full w-auto object-contain p-2" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                      <Upload size={14} />
                    </button>
                    <button onClick={() => updateWatermark({ imageUrl: undefined })} className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <div 
                  className="flex flex-col items-center justify-center gap-1 text-gray-400 w-full h-full cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="text-[10px]">当前使用默认 Logo</span>
                  <button className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none transition-colors">
                    <Upload size={10} /> 上传
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Type size={12}/> <span>文字内容</span>
            </div>
            <input
              type="text"
              value={watermark.text}
              onChange={(e) => updateWatermark({ text: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent-purple transition-colors"
              placeholder="输入文字..."
            />
            
            <select
              value={watermark.fontFamily || '"Alibaba PuHuiTi", sans-serif'}
              onChange={(e) => updateWatermark({ fontFamily: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent-purple appearance-none transition-colors"
            >
              {FONT_OPTIONS.map(font => (
                <option key={font.value} value={font.value} className="bg-[#1e1e24] text-white">
                  {font.label}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
               <button 
                 onClick={toggleBold}
                 className={`flex-1 py-1.5 rounded flex items-center justify-center transition-colors ${
                   (watermark.fontWeight || 400) >= 600 ? 'bg-accent-purple text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                 }`}
                 title="粗体"
               >
                 <Bold size={14} strokeWidth={3} />
               </button>
               <button 
                 onClick={toggleItalic}
                 className={`flex-1 py-1.5 rounded flex items-center justify-center transition-colors ${
                   watermark.fontStyle === 'italic' ? 'bg-accent-purple text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                 }`}
                 title="斜体"
               >
                 <Italic size={14} />
               </button>
               <button 
                 onClick={toggleUnderline}
                 className={`flex-1 py-1.5 rounded flex items-center justify-center transition-colors ${
                   watermark.textDecoration?.includes('underline') ? 'bg-accent-purple text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                 }`}
                 title="下划线"
               >
                 <Underline size={14} />
               </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                 <label className="text-[10px] text-gray-500 mb-1 block">文字颜色</label>
                 <div className="flex items-center gap-2 bg-black/20 rounded p-1 border border-white/5 h-8">
                   <input 
                     type="color" 
                     value={watermark.color} 
                     onChange={(e) => updateWatermark({ color: e.target.value })} 
                     className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0" 
                   />
                   <span className="text-[10px] text-gray-400 font-mono flex-1 text-right pr-1">{watermark.color}</span>
                 </div>
              </div>
              <div>
                 <label className="text-[10px] text-gray-500 mb-1 block">背景颜色</label>
                 <div className="flex items-center gap-2 bg-black/20 rounded p-1 border border-white/5 h-8">
                   <input 
                     type="color" 
                     value={watermark.backgroundColor.startsWith('#') ? watermark.backgroundColor : '#000000'} 
                     onChange={(e) => updateWatermark({ backgroundColor: e.target.value })} 
                     className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0" 
                   />
                   <button 
                     onClick={() => updateWatermark({ backgroundColor: 'transparent' })} 
                     className="text-[10px] px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded text-gray-300 ml-auto transition-colors"
                   >
                     无
                   </button>
                 </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>整体大小 (px)</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="range" 
                  min="12" 
                  max="150" 
                  value={watermark.fontSize} 
                  onChange={(e) => updateWatermark({ fontSize: Number(e.target.value) })} 
                  className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-accent-purple hover:bg-gray-500 focus:outline-none focus:ring-0" 
                />
                <input 
                  type="number" 
                  value={watermark.fontSize}
                  onChange={(e) => updateWatermark({ fontSize: Number(e.target.value) })}
                  className="w-14 bg-black/20 border border-white/10 rounded px-1 py-1 text-xs text-center text-white focus:outline-none focus:border-accent-purple transition-colors"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>不透明度</span><span>{watermark.opacity}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={watermark.opacity} 
                onChange={(e) => updateWatermark({ opacity: Number(e.target.value) })} 
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-accent-purple hover:bg-gray-500 focus:outline-none focus:ring-0" 
              />
            </div>
          </div>
        </div>
      )}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/png,image/jpeg,image/svg+xml" onChange={handleImageUpload} />
    </div>
  );
}