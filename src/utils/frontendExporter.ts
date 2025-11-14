// utils/frontendExporter.ts

import { FFmpeg, type FileData } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { useExportStore } from '@/stores/useExportStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import { buildFfmpegCommand } from './ffmpegCommandBuilder';

const FONT_FILES = [
  'AlibabaPuHuiTi-3-105-Heavy.ttf',
  'AlibabaPuHuiTi-3-115-Black.ttf',
  'ZCOOL_Addict_Italic.ttf',
  'ZcoolKuaiLe-Regular.ttf',
  'ZcoolkuheiT-Regular.ttf',
  'ZcoolQingKeHuangYou-Regular.ttf',
  'ZcoolwenyiT-Regular.ttf',
  'Zcoolxiaowei-LOGOT.ttf',
  'ZcoolYuYangT-Bold.ttf',
  'ZcoolYuYangT-Regular.ttf',
];

const ffmpeg = new FFmpeg();

ffmpeg.on('log', ({ message }) => {
  console.log(message);
});

ffmpeg.on('progress', ({ progress }) => {
  useExportStore.getState().setExportProgress(progress);
});

const loadFontsToMEMFS = async () => {
  await ffmpeg.createDir('/fonts');
  for (const font of FONT_FILES) {
    try {
      const fontData = await fetchFile(`/fonts/${font}`);
      await ffmpeg.writeFile(`/fonts/${font}`, fontData);
    } catch (e) {
      console.error('加载字体失败:', font, e);
    }
  }
};

const loadMediaToMEMFS = async (
  remoteUrls: { url: string; localPath: string }[]
) => {
  const { setExportStatus } = useExportStore.getState();
  
  try {
    await ffmpeg.createDir('/media');
  } catch (e) {
    console.warn('createDir /media warning (ignorable):', e);
  }

  await Promise.all(
    remoteUrls.map(async ({ url, localPath }) => {
      try {
        setExportStatus('uploading');
        
        let data: Uint8Array | FileData;

        if (url.startsWith('blob:')) {
          const response = await fetch(url);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          data = new Uint8Array(arrayBuffer);
        } else {
          data = await fetchFile(url);
        }
        
        await ffmpeg.writeFile(localPath, data);

      } catch (e) {
        console.error('加载媒体失败:', url, e);
        throw new Error(`无法获取媒体文件: ${url}`);
      }
    })
  );
};

export const runFrontendExport = async (): Promise<Blob> => {
  const { setExportStatus, setExportError, exportSettings } =
    useExportStore.getState();
  const project = useProjectStore.getState().exportProject();
  const { isPremium } = useUserStore.getState();

  try {
    if (!ffmpeg.loaded) {
      setExportStatus('preparing');
      await ffmpeg.load();
      await loadFontsToMEMFS();
    }

    const { command, mapper } = buildFfmpegCommand(
      project,
      exportSettings,
      'frontend',
      isPremium
    );

    await loadMediaToMEMFS(mapper.remoteUrls);

    setExportStatus('processing_frontend');

    const ffmpegArgs = [
      ...mapper.remoteUrls.flatMap((f) => ['-i', f.localPath]),
      ...command,
    ];
    
    const outputFilename = exportSettings.format === 'gif' ? 'output.gif' : 'output.mp4';
    const outputMimeType = exportSettings.format === 'gif' ? 'image/gif' : 'video/mp4';

    await ffmpeg.exec(ffmpegArgs); 

    const data: FileData = await ffmpeg.readFile(outputFilename); 

    ffmpeg.deleteFile(outputFilename); 
    mapper.remoteUrls.forEach((f) => ffmpeg.deleteFile(f.localPath));

    if (typeof data === 'string') {
      throw new Error('ffmpeg.readFile 返回了字符串，预期为 Uint8Array');
    }

    return new Blob([data.slice()], { type: outputMimeType });

  } catch (error) {
    console.error('前端导出失败:', error);
    setExportError(error instanceof Error ? error.message : '未知 FFMPEG 错误');
    throw error;
  }
};