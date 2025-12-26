export const captureWatermarkSnapshot = async (): Promise<Blob | null> => {
  const node = document.getElementById('watermark-preview-node');
  
  if (!node) {
    console.warn('未找到水印节点');
    return null;
  }
  
  try {
    const clone = node.cloneNode(true) as HTMLElement;
    
    // 创建 wrapper
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      position: 'fixed',
      top: '-9999px',
      left: '-9999px',
      zIndex: '9999',
      display: 'block',
      width: 'fit-content',
      height: 'fit-content',
    });
    
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);
    
    // 复制计算后的样式(关键!)
    const copyComputedStyles = (source: Element, target: Element) => {
      const computedStyle = window.getComputedStyle(source);
      const targetEl = target as HTMLElement;
      
      // 复制关键样式属性
      const importantStyles = [
        'color',
        'backgroundColor',
        'fontSize',
        'fontFamily',
        'fontWeight',
        'fontStyle',
        'lineHeight',
        'textAlign',
        'opacity',
        'textShadow',
        'letterSpacing',
      ];
      
      importantStyles.forEach(prop => {
        const value = computedStyle.getPropertyValue(prop);
        if (value) {
          targetEl.style.setProperty(prop, value);
        }
      });
      
      // 递归处理子元素
      const sourceChildren = Array.from(source.children);
      const targetChildren = Array.from(target.children);
      sourceChildren.forEach((sourceChild, index) => {
        if (targetChildren[index]) {
          copyComputedStyles(sourceChild, targetChildren[index]);
        }
      });
    };
    
    // 复制原始节点的所有计算样式到克隆节点
    copyComputedStyles(node, clone);
    
    // 清理并规范化样式
    Object.assign(clone.style, {
      transform: 'none',
      position: 'static',
      margin: '0',
      padding: '0',
    });
    
    // 处理布局模式
    if (clone.classList.contains('grid')) {
      clone.style.display = 'grid';
      clone.style.placeItems = 'center';
    } else {
      clone.style.display = 'flex';
      clone.style.alignItems = 'center';
      clone.style.justifyContent = 'center';
    }
    
    // 修复图片对齐问题
    const imgs = clone.querySelectorAll('img');
    imgs.forEach(img => {
      const imgEl = img as HTMLElement;
      imgEl.style.verticalAlign = 'middle';
      imgEl.style.display = 'block';
    });
    
    // 等待图片加载
    await Promise.all(
      Array.from(imgs).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>(resolve => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      })
    );
    
    // 多等几帧,确保样式应用完成
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    const options: any = {
      backgroundColor: null,
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: clone.offsetWidth,
      height: clone.offsetHeight,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
    };
    
    const canvas = await html2canvas(clone, options);
    document.body.removeChild(wrapper);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  } catch (error) {
    console.error('水印生成快照失败:', error);
    return null;
  }
};