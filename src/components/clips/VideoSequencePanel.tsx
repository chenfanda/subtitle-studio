import { useState } from 'react';
import { ClipSubtitleList } from './ClipSubtitleList';
import { BatchInsertDialog } from './BatchInsertDialog'; 
import { BatchCutDialog } from './BatchCutDialog'; // 引入新组件
import { Layers, Scissors } from 'lucide-react';

export function VideoSequencePanel() {
  const [showBatchInsert, setShowBatchInsert] = useState(false);
  const [showBatchCut, setShowBatchCut] = useState(false); // 新增状态

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      
      {/* 顶部 Header */}
     <div className="p-3 border-b border-border-secondary bg-bg-primary flex-none">
        <div className="flex gap-2">
          <button  
            onClick={() => setShowBatchInsert(true)}  
            className="  
              flex-1 flex items-center justify-center gap-1.5   
              py-2 rounded-md text-xs font-medium transition-all  
              bg-accent-purple/10 text-accent-purple border border-accent-purple/20  
              hover:bg-accent-purple hover:text-white hover:border-accent-purple  
            "  
          >  
            <Layers size={14} />  
            <span>批量插入</span>  
          </button>  
            
          <button  
            onClick={() => setShowBatchCut(true)} 
            className="  
              flex-1 flex items-center justify-center gap-1.5   
              py-2 rounded-md text-xs font-medium transition-all  
              bg-accent-red/10 text-accent-red border border-accent-red/20  
              hover:bg-accent-red hover:text-white hover:border-accent-red  
            "  
          >  
            <Scissors size={14} />  
            <span>自定义剪切</span>  
          </button>  
        </div>  
      </div>

      {/* 原有列表 */}
      <div className="flex-1 overflow-auto">
        <ClipSubtitleList />
      </div>

      {/* 弹窗挂载 */}
      {showBatchInsert && (
        <BatchInsertDialog onClose={() => setShowBatchInsert(false)} />
      )}
      
      {showBatchCut && (
        <BatchCutDialog onClose={() => setShowBatchCut(false)} />
      )}
    </div>
  );
}