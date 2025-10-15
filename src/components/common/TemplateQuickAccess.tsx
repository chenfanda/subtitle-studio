import { useUIStore } from '@/stores/useUIStore';
import { useTemplateStore } from '@/stores/useTemplateStore';
import { ANIMATION_TEMPLATES } from '@/constants/animationTemplates';

interface TemplateQuickAccessProps {
  targetType: 'subtitle' | 'textElement';
  targetId: string;
}

export function TemplateQuickAccess({ targetType, targetId }: TemplateQuickAccessProps) {
  const { setActivePanel } = useUIStore();
  const { applyAnimationToRange } = useTemplateStore();
  
  // ✅ 获取2个推荐模板（从精选分类）
  const featuredTemplates = ANIMATION_TEMPLATES.featured?.slice(0, 2) || [];
  
  const handleTemplateClick = (template: any) => {
    if (template.effects && template.effects[0]) {
      applyAnimationToRange(targetId, template.effects[0]);
    }
  };
  
  const handleViewMore = () => {
    setActivePanel('templates');
  };
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-text-primary">模板</h3>
      
      {/* 2个模板卡片 */}
      <div className="grid grid-cols-2 gap-3">
        {featuredTemplates.map(template => (
          <button
            key={template.id}
            onClick={() => handleTemplateClick(template)}
            className="aspect-video rounded-lg border-2 border-border-secondary hover:border-accent-purple transition-all overflow-hidden bg-bg-tertiary flex items-center justify-center group"
          >
            <div className="text-center p-2">
              <div className="text-xs font-medium text-text-primary group-hover:text-accent-purple transition-colors">
                {template.name}
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {/* 查看更多按钮 */}
      <button
        onClick={handleViewMore}
        className="w-full py-2 text-sm text-accent-purple hover:text-accent-purple/80 border border-border-secondary rounded-lg hover:bg-bg-tertiary transition-all flex items-center justify-center gap-2"
      >
        <span>查看更多模板</span>
        <span>→</span>
      </button>
    </div>
  );
}