const fs = require('fs');
const path = require('path');

/**
 * 核心扫描逻辑：主进程调用它读硬盘，返回数据给前端
 */
function scanMediaDirectory(mediaPath) {
  if (!fs.existsSync(mediaPath)) return [];

  const files = fs.readdirSync(mediaPath);
  return files
    .filter(f => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f))
    .map(file => ({
      id: `preset-${file}`,
      url: `/assets/media/${file}`,
      preview: `/assets/media/${file}`,
      type: file.toLowerCase().endsWith('.gif') ? 'gif' : 'sticker',
      tags: ['preset'],
      width: 200,
      height: 200,
    }));
}

module.exports = { scanMediaDirectory };