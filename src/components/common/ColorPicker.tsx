import { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  onClose: () => void;
  position?: { top: number; left: number };
  allowTransparent?: boolean;
  className?: string;
}

const PRESET_COLORS = [
  ['#FFFFFF', '#000000', '#4A4A4A', '#6B6B6B', '#8C8C8C', '#ADADAD', '#CECECE', '#EFEFEF'],
  ['#FF0000', '#FF4D00', '#FF9A00', '#FFE600', '#CCFF00', '#80FF00', '#33FF00', '#00FF1A'],
  ['#00FF66', '#00FFB3', '#00FFFF', '#00B3FF', '#0066FF', '#001AFF', '#3300FF', '#7F00FF'],
  ['#CC00FF', '#FF00E6', '#FF0099', '#FF004D', '#FF6B6B', '#FFA56B', '#FFDF6B', '#E6FF6B'],
];

const RECENT_COLORS_KEY = 'colorpicker_recent_colors';

export function ColorPicker({ value, onChange, onClose, position, allowTransparent = false, className = '' }: ColorPickerProps) {
  const [mode, setMode] = useState<'hex' | 'rgb'>('hex');
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(RECENT_COLORS_KEY);
    if (saved) {
      setRecentColors(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (!value || value === 'transparent') return;
    
    const color = value.replace('#', '');
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const l = (max + min) / 2;
    
    let h = 0;
    let s = 0;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r / 255:
          h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g / 255:
          h = ((b / 255 - r / 255) / d + 2) / 6;
          break;
        case b / 255:
          h = ((r / 255 - g / 255) / d + 4) / 6;
          break;
      }
    }
    
    setHue(Math.round(h * 360));
    setSaturation(Math.round(s * 100));
    setLightness(Math.round(l * 100));
  }, [value]);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    for (let y = 0; y < height; y++) {
      const l = 100 - (y / height) * 100;
      for (let x = 0; x < width; x++) {
        const s = (x / width) * 100;
        ctx.fillStyle = `hsl(${hue}, ${s}%, ${l}%)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [hue]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const s = Math.round((x / rect.width) * 100);
    const l = Math.round(100 - (y / rect.height) * 100);
    
    setSaturation(s);
    setLightness(l);
    
    const color = hslToHex(hue, s, l);
    handleColorSelect(color);
  };

  const handleCanvasMouseDown = () => {
    isDragging.current = true;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    handleCanvasClick(e);
  };

  const handleCanvasMouseUp = () => {
    isDragging.current = false;
  };

  const handleColorSelect = (color: string) => {
    onChange(color);
    
    if (color !== 'transparent') {
      const updated = [color, ...recentColors.filter(c => c !== color)].slice(0, 8);
      setRecentColors(updated);
      localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
    }
  };

  const handleHueChange = (newHue: number) => {
    setHue(newHue);
    const color = hslToHex(newHue, saturation, lightness);
    handleColorSelect(color);
  };

  const handleHexChange = (hex: string) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      handleColorSelect(hex.toUpperCase());
    }
  };

  const handleRgbChange = (r: number, g: number, b: number) => {
    const hex = rgbToHex(r, g, b);
    handleColorSelect(hex);
  };

  const getRgbFromHex = (hex: string) => {
    if (!hex || hex === 'transparent') {
      return { r: 0, g: 0, b: 0 };
    }
    const color = hex.replace('#', '');
    return {
      r: parseInt(color.substring(0, 2), 16),
      g: parseInt(color.substring(2, 4), 16),
      b: parseInt(color.substring(4, 6), 16)
    };
  };

  const hslToHex = (h: number, s: number, l: number) => {
    const hDecimal = h / 360;
    const sDecimal = s / 100;
    const lDecimal = l / 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = lDecimal;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = lDecimal < 0.5 ? lDecimal * (1 + sDecimal) : lDecimal + sDecimal - lDecimal * sDecimal;
      const p = 2 * lDecimal - q;
      
      r = hue2rgb(p, q, hDecimal + 1/3);
      g = hue2rgb(p, q, hDecimal);
      b = hue2rgb(p, q, hDecimal - 1/3);
    }
    
    return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, x)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  };

  const rgb = getRgbFromHex(value);

  return (
    <div
      ref={pickerRef}
      className={`bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 w-64 max-h-96 overflow-y-auto ${className}`}
      style={position ? { top: position.top, left: position.left } : {}}
    >
      <div className="space-y-3">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={232}
            height={140}
            className="w-full rounded cursor-crosshair"
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
          <div
            className="absolute w-4 h-4 border-2 border-white rounded-full pointer-events-none"
            style={{
              left: `${saturation}%`,
              top: `${100 - lightness}%`,
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 3px rgba(0,0,0,0.8)'
            }}
          />
        </div>

        <div className="h-3 rounded relative overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)'
            }}
          />
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => handleHueChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div
            className="absolute top-0 bottom-0 w-3 h-3 bg-white border-2 border-gray-800 rounded-full pointer-events-none"
            style={{ left: `${(hue / 360) * 100}%`, transform: 'translateX(-50%)' }}
          />
        </div>

        {recentColors.length > 0 && (
          <div>
            <div className="text-xs text-gray-400 mb-2">最近使用</div>
            <div className="flex gap-2 flex-wrap">
              {recentColors.slice(0, 8).map((color, index) => (
                <button
                  key={index}
                  onClick={() => handleColorSelect(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    value.toUpperCase() === color.toUpperCase()
                      ? 'border-white scale-110'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1">
          {allowTransparent && (
            <div className="flex gap-1 mb-1">
              <button
                onClick={() => handleColorSelect('transparent')}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  value === 'transparent'
                    ? 'border-white scale-110'
                    : 'border-gray-600 hover:border-gray-400'
                }`}
                style={{ backgroundColor: '#ffffff' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <line x1="3" y1="13" x2="13" y2="3" stroke="#ff0000" strokeWidth="2"/>
                </svg>
              </button>
            </div>
          )}
          
          {PRESET_COLORS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1">
              {row.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    value.toUpperCase() === color.toUpperCase()
                      ? 'border-white scale-110'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700 pt-3">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setMode('hex')}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                mode === 'hex'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Hex
            </button>
            <button
              onClick={() => setMode('rgb')}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                mode === 'rgb'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              RGB
            </button>
          </div>

          {mode === 'hex' ? (
            <input
              type="text"
              value={value === 'transparent' ? '' : value}
              onChange={(e) => handleHexChange(e.target.value)}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-white font-mono"
              placeholder="#FFFFFF"
            />
          ) : (
            <div className="grid grid-cols-3 gap-1">
              <input
                type="number"
                min="0"
                max="255"
                value={rgb.r}
                onChange={(e) => handleRgbChange(Number(e.target.value), rgb.g, rgb.b)}
                className="px-1 py-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-white text-center"
                placeholder="R"
              />
              <input
                type="number"
                min="0"
                max="255"
                value={rgb.g}
                onChange={(e) => handleRgbChange(rgb.r, Number(e.target.value), rgb.b)}
                className="px-1 py-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-white text-center"
                placeholder="G"
              />
              <input
                type="number"
                min="0"
                max="255"
                value={rgb.b}
                onChange={(e) => handleRgbChange(rgb.r, rgb.g, Number(e.target.value))}
                className="px-1 py-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-white text-center"
                placeholder="B"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}