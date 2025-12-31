import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { TextElement } from '@/types/textElement';
import type { SubtitleStyle } from '@/types/subtitle';
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitle';
import { DEFAULT_TEXT_ELEMENT_POSITION } from '@/types/textElement';
import { findById, generateId, deepClone } from '@/utils/storeUtils';
import { useHistoryStore } from './useHistoryStore';
import { useProjectStore } from './useProjectStore';

interface TextElementStore {
  textElements: TextElement[];
  
  addTextElement: (element: Omit<TextElement, 'id'>) => string;
  updateTextElement: (id: string, updates: Partial<TextElement>) => void;
  updateTextElementText: (id: string, text: string) => void;
  deleteTextElement: (id: string) => void;
  
  updateTextElementPosition: (id: string, x: number, y: number) => void;
  updateTextElementTransform: (id: string, scaleX: number, scaleY: number, rotation: number) => void;
  updateAllTextElementStyles: (style: SubtitleStyle) => void; 
  
  applyStyleToAllTextElementsOfType: (type: string, style: SubtitleStyle) => void;
  getTextElementType: (id: string) => string;
  
  restoreTextElements: (textElements: TextElement[]) => void;
}

export const useTextElementStore = create<TextElementStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      textElements: [],
      
      addTextElement: (element) => {
        const id = generateId();
        
        set((state) => {
          state.textElements.push({ 
            ...element, 
            id,
            position: element.position || { ...DEFAULT_TEXT_ELEMENT_POSITION }
          });
        });
        
        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
        
        return id;
      },
      
      updateTextElement: (id, updates) => {
              set((state) => {
                const element = findById(state.textElements, id);
                if (!element) return;

                if (updates.style && element.richText) {
                  
                  const mainStyle = element.style || DEFAULT_SUBTITLE_STYLE;

                  element.richText = element.richText.map(segment => {
                  
                    const baseStyle = segment.style || mainStyle;

                    return {
                      ...segment,
                
                      style: { 
                        ...baseStyle,     
                        ...updates.style  
                      } 
                    };
                  });
                }
                
                Object.assign(element, updates);
              });
              
              useProjectStore.getState().markUnsaved();
              useHistoryStore.getState().pushState();
            },
      
      updateTextElementText: (id, text) => {
        set((state) => {
          const element = findById(state.textElements, id);
          if (!element) return;
          
          element.text = text;
          
          if (element.richText && element.richText.length > 0) {
            element.richText[0].text = text;
          }
        });
        
        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },
      
      deleteTextElement: (id) => {
        set((state) => {
          state.textElements = state.textElements.filter(e => e.id !== id);
        });
        
        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().pushState();
      },
      
      updateTextElementPosition: (id, x, y) => {
        set((state) => {
          const element = findById(state.textElements, id);
          if (!element) return;
          
          element.position.x = x;
          element.position.y = y;
        });
        
        useProjectStore.getState().markUnsaved();
      },
      
      updateTextElementTransform: (id, scaleX, scaleY, rotation) => {
        set((state) => {
          const element = findById(state.textElements, id);
          if (!element) return;
          
          element.position.scaleX = scaleX;
          element.position.scaleY = scaleY;
          element.position.rotation = rotation;
        });
        
        useProjectStore.getState().markUnsaved();
      },
      
      applyStyleToAllTextElementsOfType: (type, style) => {
        useHistoryStore.getState().startBatch();
        
        set((state) => {
          state.textElements.forEach(element => {
            if (element.type === type) {
              element.style = { ...element.style, ...style };
              
              if (element.richText) {
                element.richText = element.richText.map(segment => ({
                  ...segment,
                  style: { ...segment.style, ...style }
                }));
              }
            }
          });
        });
        
        useProjectStore.getState().markUnsaved();
        useHistoryStore.getState().endBatch();
      },

      updateAllTextElementStyles: (style) => {
          useHistoryStore.getState().startBatch();
          
          set((state) => {
            // 遍历所有元素，不进行 type 判断，直接应用样式
            state.textElements.forEach(element => {
              element.style = { ...element.style, ...style };
              
              // 同步更新富文本样式
              if (element.richText) {
                element.richText = element.richText.map(segment => ({
                  ...segment,
                  style: { ...segment.style, ...style }
                }));
              }
            });
          });
          
          useProjectStore.getState().markUnsaved();
          useHistoryStore.getState().endBatch();
        },
      
      getTextElementType: (id) => {
        const element = findById(get().textElements, id);
        return element?.type || 'unknown';
      },
      
      restoreTextElements: (textElements) => {
        set((state) => {
          state.textElements = textElements;
        });
      },
    }))
  )
);