/// <reference types="vite/client" />
interface Window {
  electronAPI: {
    saveAvatar: (buffer: ArrayBuffer, fileName: string) => Promise<string>;
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  }
}