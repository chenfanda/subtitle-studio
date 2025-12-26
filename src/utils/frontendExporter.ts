import { FFmpeg, type FileData } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { useProjectStore } from '@/stores/useProjectStore';
import { buildFfmpegCommand } from './ffmpegCommandBuilder';
import { getFontPath } from './ffmpegUtils';
import type { ProjectExport } from '@/types/project';
import type { ExportSettings } from '@/stores/useExportStore';

const ffmpeg = new FFmpeg();

// 辅助：检查中断
const checkAbort = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    throw new Error('Aborted');
  }
};

// 辅助：进度权重计算器
const calculateProgress = (phase: 'setup' | 'download' | 'encode', value: number) => {
  let base = 0;
  let weight = 0;

  switch (phase) {
    case 'setup':    // 0% - 10% (初始化 & 字体)
      base = 0;
      weight = 0.1;
      break;
    case 'download': // 10% - 30% (下载媒体)
      base = 0.1;
      weight = 0.2;
      break;
    case 'encode':   // 30% - 100% (FFmpeg 编码)
      base = 0.3;
      weight = 0.7;
      break;
  }

  return base + (value * weight);
};

const getRequiredFontFiles = (project: ProjectExport): Set<string> => {
    const fontFiles = new Set<string>();
    const addFontByFamily = (fontFamily: string) => {
        if (!fontFamily) return;
        const fullPath = getFontPath(fontFamily, 'frontend');
        const fileName = fullPath.split('/').pop();
        if (fileName) fontFiles.add(fileName);
    };
    
    // --- 修改点：移除水印字体加载 ---
    // 因为水印现在使用截图 (image overlay) 方式，不再需要加载字体文件
    /*
    if (project.settings?.watermark?.enabled && project.settings.watermark.fontFamily) {
        addFontByFamily(project.settings.watermark.fontFamily);
    }
    */
    
    project.content.subtitles?.forEach((sub) => {
        if (sub.style?.fontFamily) addFontByFamily(sub.style.fontFamily);
        sub.richText?.forEach((seg: any) => {
             if (seg.style?.fontFamily) addFontByFamily(seg.style.fontFamily);
        });
    });
    
    project.content.textElements?.forEach((el) => {
        if (el.style?.fontFamily) addFontByFamily(el.style.fontFamily);
        el.richText?.forEach((seg: any) => {
            if (seg.style?.fontFamily) addFontByFamily(seg.style.fontFamily);
        });
    });
    
    addFontByFamily('ZcoolKuaiLe'); // 默认字体
    return fontFiles;
};

const loadFontsToMEMFS = async (
  fontFiles: Set<string>,
  onProgress?: (p: number, msg: string) => void,
  signal?: AbortSignal
) => {
  try { await ffmpeg.createDir('/fonts'); } catch (e) {}

  const total = fontFiles.size;
  let loaded = 0;

  for (const font of fontFiles) {
    checkAbort(signal); // 检查中断
    try {
      // 检查是否已存在，避免重复加载
      try {
        await ffmpeg.readFile(`/fonts/${font}`);
        loaded++;
        continue; 
      } catch (e) {}

      const fontData = await fetchFile(`/fonts/${font}`);
      await ffmpeg.writeFile(`/fonts/${font}`, fontData);
      
      loaded++;
      const progress = calculateProgress('setup', loaded / total);
      onProgress?.(progress, `正在加载字体 (${loaded}/${total})...`);

    } catch (e) {
      console.warn(`字体加载失败: ${font}`, e);
      // 失败也算进度，避免卡死
      loaded++;
    }
  }
};

const loadMediaToMEMFS = async (
  remoteUrls: { url: string; localPath: string }[],
  onProgress?: (p: number, msg: string) => void,
  signal?: AbortSignal
) => {
  try { await ffmpeg.createDir('/media'); } catch (e) {}

  const total = remoteUrls.length;
  let completed = 0;

  const resolveUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http')) return url;
  if (url.startsWith('/')) return new URL(url, window.location.origin).toString();
  return url;
  };

 await Promise.all(
    remoteUrls.map(async ({ url: rawUrl, localPath }) => {
      checkAbort(signal);
      const url = resolveUrl(rawUrl);
      
      try {
        let data: Uint8Array | FileData;
        
        if (url.startsWith('blob:')) {
          const response = await fetch(url); 
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          data = new Uint8Array(arrayBuffer);
        } else {
      
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP Error ${response.status} at ${url}`);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          data = new Uint8Array(arrayBuffer);
        }
        
        checkAbort(signal); 
        await ffmpeg.writeFile(localPath, data);
        
        completed++;
        const progress = calculateProgress('download', completed / total);
        onProgress?.(progress, `正在下载素材 (${completed}/${total})...`);

      } catch (e) {
        if (e instanceof Error && e.message === 'Aborted') throw e;
        console.error(`Media load failed: ${url}`, e);
        throw new Error(`无法加载素材: ${url}`);
      }
    })
  );
};

export const runFrontendExport = async (
  projectOverride: ProjectExport | undefined,
  settings: ExportSettings,
  isPremium: boolean,
  onProgress?: (percent: number, msg: string) => void,
  signal?: AbortSignal
): Promise<Blob> => {
  
  const project = projectOverride || useProjectStore.getState().exportProject();

  const abortHandler = () => {
    try {
      console.log('检测到取消信号，正在终止 FFmpeg...');
      ffmpeg.terminate(); 
    } catch (e) {
      console.warn('终止 FFmpeg 失败', e);
    }
  };
  
  if (signal) {
    signal.addEventListener('abort', abortHandler);
  }
  try {
    checkAbort(signal);
    
    // 0. 初始化
    if (!ffmpeg.loaded) {
      onProgress?.(0.05, '正在启动渲染引擎...');
      await ffmpeg.load();
    }

    // 1. 字体加载
    onProgress?.(calculateProgress('setup', 0), '分析字体需求...');
    const requiredFonts = getRequiredFontFiles(project);
    await loadFontsToMEMFS(requiredFonts, onProgress, signal);

    // 2. 构建命令
    onProgress?.(calculateProgress('download', 0), '分析媒体列表...');
    const { command, mapper } = buildFfmpegCommand(
      project,
      settings,
      'frontend',
      isPremium
    );

    // 3. 媒体加载
    // 此时 mapper.remoteUrls 里应该已经包含了 watermark.snapshotUrl (由 buildFfmpegCommand 处理)
    await loadMediaToMEMFS(mapper.remoteUrls, onProgress, signal);

    // 4. 编码
    checkAbort(signal);
    onProgress?.(calculateProgress('encode', 0), '开始视频编码...');

    const inputArgs = mapper.remoteUrls.flatMap((f) => {
      const isGif = f.localPath.toLowerCase().endsWith('.gif');
      return isGif ? ['-ignore_loop', '0', '-i', f.localPath] : ['-i', f.localPath];
    });

    const ffmpegArgs = [...inputArgs, ...command];
    const outputFilename = settings.format === 'gif' ? 'output.gif' : 'output.mp4';
    const outputMimeType = settings.format === 'gif' ? 'image/gif' : 'video/mp4';

    // 监听进度
    const progressHandler = ({ progress }: { progress: number }) => {
        // 这里的 progress 可能会超过 1 或乱跳，需做防护
        const validP = Math.max(0, Math.min(1, progress));
        const finalP = calculateProgress('encode', validP);
        onProgress?.(finalP, `正在合成视频 ${(validP * 100).toFixed(0)}%`);
    };
    ffmpeg.on('progress', progressHandler);

    // 执行命令
    try {
      await ffmpeg.exec(ffmpegArgs);
    } catch (error: any) {
      
      if (signal?.aborted) {
        throw new Error('Aborted');
      }
      throw error;
    }
    
    // 移除监听，防止内存泄漏
    ffmpeg.off('progress', progressHandler);

    checkAbort(signal); // 最终检查

    // 读取文件
    const data: FileData = await ffmpeg.readFile(outputFilename); 

    
    try {
        ffmpeg.deleteFile(outputFilename); 
        mapper.remoteUrls.forEach((f) => {
            try { ffmpeg.deleteFile(f.localPath); } catch(e){}
        });
    } catch(e) {}

    return new Blob([data.slice()], { type: outputMimeType });

  } catch (error) {
    // 确保移除监听
    ffmpeg.off('progress', undefined as any); 
    throw error;
  } finally {
    if (signal) {
      signal.removeEventListener('abort', abortHandler);
    }
  }
};