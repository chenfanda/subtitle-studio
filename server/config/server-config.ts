import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const SERVER_CONFIG = {
  PORT: process.env.PORT || 8000,
  
  INTERNAL_SERVICES: {
    
    ASR_URL: process.env.INTERNAL_ASR_URL || 'http://localhost:8008/transcribe',
    
    
    TTS_URL: process.env.INTERNAL_TTS_URL || 'http://localhost:8010',
    
    REDIS: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    }
  },

  PATHS: {
    UPLOAD_DIR: path.join(process.cwd(), 'public', 'uploads'),
    DOWNLOAD_DIR: path.join(process.cwd(), 'public', 'downloads'),
  }
};