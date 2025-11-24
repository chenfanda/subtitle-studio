/**
 * remotion.config.ts
 * Remotion 渲染引擎的全局配置文件
 */
import { Config } from '@remotion/cli/config';
import path from 'path';

// 设置默认的图片格式，避免某些环境下的兼容性问题
Config.setVideoImageFormat('jpeg');

// 覆盖 Webpack 配置
// 目的：让 Remotion 后端环境能识别前端代码中的 '@/...' 路径别名
Config.overrideWebpackConfig((currentConfiguration) => {
  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: {
        ...(currentConfiguration.resolve?.alias ?? {}),
        '@': path.join(process.cwd(), 'src'),
      },
    },
  };
});