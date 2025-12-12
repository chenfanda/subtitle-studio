import fs from 'fs';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { QueueEvents } from 'bullmq'; 
import multer from 'multer';
import axios from 'axios';         
import FormData from 'form-data';  


import { SERVER_CONFIG } from './config/server-config';
import { renderQueue, connection } from './queue'; 
import './worker'; 
import { optimizationQueue } from './queue-optimization';

const app = express();

const PORT = SERVER_CONFIG.PORT;
const CANCEL_CHANNEL = 'RENDER_CANCEL_CHANNEL';
const TTS_SERVICE_URL = SERVER_CONFIG.INTERNAL_SERVICES.TTS_URL;

app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '500mb' })); 

const optimizationQueueEvents = new QueueEvents('video-optimization-queue', { connection });

// 【修改】使用配置中的上传路径
const uploadDir = SERVER_CONFIG.PATHS.UPLOAD_DIR;
try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  console.error(err);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } 
});


const downloadsDir = SERVER_CONFIG.PATHS.DOWNLOAD_DIR;
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

const staticOptions = {
  acceptRanges: true,
  lastModified: true,
  etag: true,
  setHeaders: (res: express.Response) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*'); 
  }
};

app.use('/uploads', express.static(uploadDir, staticOptions));
app.use('/downloads', express.static(downloadsDir, staticOptions));


app.post('/api/upload', (req, res) => {
  const uploadMiddleware = upload.single('file');

  uploadMiddleware(req, res, async (err) => {
    if (err || !req.file) {
      return res.status(400).json({ error: err?.message || 'File missing' });
    }

    const { path: filePath, filename: fileName } = req.file;

    try {
      const job = await optimizationQueue.add('optimize', { filePath, fileName });
      const result = await job.waitUntilFinished(optimizationQueueEvents);
      res.json({ url: result.url });
    } catch (error) {
      res.json({ url: `/uploads/${fileName}` });
    }
  });
});


app.post('/api/process-media', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // 文件已由 multer 保存到本地 uploadDir
  const filePath = req.file.path; 

  try {
    console.log(`[Gateway] Forwarding ${req.file.filename} to Internal ASR...`);

    
    const internalFormData = new FormData();
    internalFormData.append('file', fs.createReadStream(filePath));
    
    
    if(req.body.user_id) internalFormData.append('user_id', req.body.user_id);
    if(req.body.project_id) internalFormData.append('project_id', req.body.project_id);
    
    // 处理布尔值参数
    const vocalSep = req.body.enable_vocal_separation === 'true' || req.body.enable_vocal_separation === true;
    internalFormData.append('enable_vocal_separation', vocalSep ? 'true' : 'false');
    const enableDiarization = req.body.enable_diarization === 'true' || req.body.enable_diarization === true;
    internalFormData.append('enable_diarization', enableDiarization ? 'true' : 'false');

    // 2. 获取内网 ASR 地址并转发
    const asrUrl = SERVER_CONFIG.INTERNAL_SERVICES.ASR_URL;
    
    const response = await axios.post(asrUrl, internalFormData, {
      headers: { ...internalFormData.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('[Gateway] ASR Response Success');


    const result = response.data;
    
    
    if (result?.data?.source_resources?.video) {
        
        result.data.source_resources.video = `/uploads/${req.file.filename}`;
    }

    res.json(result);

  } catch (error: any) {
    console.error('[Gateway Error]', error.message);
    
    if (error.response) {
       console.error('ASR Error Data:', error.response.data);
       return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ error: 'Cloud Processing Service Unavailable' });
  }
  
});


app.get(/^\/api\/static\/(.*)/, async (req, res) => {
  try {
    const resourcePath = req.params[0];
    const asrServiceUrl = new URL(SERVER_CONFIG.INTERNAL_SERVICES.ASR_URL);
    const asrBaseOrigin = asrServiceUrl.origin;
    const targetUrl = `${asrBaseOrigin}/static/${resourcePath}`;

    
    const headers: Record<string, string> = {};
    if (req.headers.range) {
      headers['Range'] = req.headers.range as string;
    }

    const response = await axios({
      method: 'get',
      url: targetUrl,
      responseType: 'stream',
      headers: headers, 
      validateStatus: (status) => status < 500 
    });


    res.status(response.status);
    
 
    Object.keys(response.headers).forEach(key => {
      res.set(key, response.headers[key]);
    });

    
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');

    response.data.pipe(res);

  } catch (error: any) {
    if (error.response) {
      
      res.status(error.response.status).send(error.message);
    } else {
      console.error(`[Proxy Error] ${error.message}`);
      res.status(500).send('Proxy Error');
    }
  }
});



app.get(/^\/api\/tts\/(.*)/, async (req, res) => {
  const path = req.path.replace('/api/tts', '');
  const targetUrl = `${TTS_SERVICE_URL}${path}`;
  try {
    const response = await axios({
      method: 'get',
      url: targetUrl,
      responseType: 'stream'
    });
    res.set(response.headers);
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
    response.data.pipe(res);
  } catch (e: any) {
    res.status(e.response?.status || 500).send(e.message);
  }
});


app.post(['/api/tts/tts_with_character', '/api/tts/tts_timeline_dialogue'], async (req, res) => {
  const path = req.path.replace('/api/tts', '');
  try {
    const response = await axios.post(`${TTS_SERVICE_URL}${path}`, req.body);
    res.json(response.data);
  } catch (e: any) {
    res.status(e.response?.status || 500).json(e.response?.data || { error: 'TTS Error' });
  }
});


app.post('/api/tts/save_custom_voice', upload.single('audio_file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  try {
    const formData = new FormData();
    formData.append('audio_file', fs.createReadStream(req.file.path));
    Object.keys(req.body).forEach(k => formData.append(k, req.body[k]));
    
    const response = await axios.post(`${TTS_SERVICE_URL}/save_custom_voice`, formData, {
      headers: formData.getHeaders()
    });
    fs.unlinkSync(req.file.path); // 清理
    res.json(response.data);
  } catch (e: any) {
    res.status(500).json({ error: 'Upload Failed' });
  }
});

app.post('/api/tts/tts_with_custom_voice', upload.none(), async (req, res) => {
  try {
    const formData = new FormData();
    Object.keys(req.body).forEach(k => formData.append(k, req.body[k]));
    const response = await axios.post(`${TTS_SERVICE_URL}/tts_with_custom_voice`, formData, {
      headers: formData.getHeaders()
    });
    res.json(response.data);
  } catch (e: any) {
    res.status(500).json({ error: 'Generation Failed' });
  }
});


app.delete(/^\/api\/tts\/(.*)/, async (req, res) => {
  const path = req.path.replace('/api/tts', '');
  try {
    const response = await axios.delete(`${TTS_SERVICE_URL}${path}`);
    res.json(response.data);
  } catch (e: any) {
    res.status(500).json({ error: 'Delete Failed' });
  }
});

app.post('/api/export', async (req, res) => {
  try {
    const body = req.body;
    
    const project = body.project || body;
    const exportSettings = body.exportSettings || { resolution: 1080, format: 'mp4' };
    if (!project || !project.content) {
      return res.status(400).json({ error: '无效的项目数据' });
    }

    const jobId = uuidv4();

    await renderQueue.add('render', {
      project,
      jobId,
      exportSettings
    }, {
      jobId, 
      removeOnComplete: 100,
      removeOnFail: 200
    });
    
    res.json({ 
      jobId, 
      status: 'queued',
      message: '任务已加入队列' 
    });

  } catch (error: any) {
    res.status(500).json({ error: '服务器内部错误或队列失败', details: error.message });
  }
});

// ----------------------------------------------------------------
// 接口 4: 取消任务
// ----------------------------------------------------------------
app.post('/api/cancel', async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const job = await renderQueue.getJob(jobId);
    if (job) {
      await connection.publish(CANCEL_CHANNEL, jobId);
      return res.json({ status: 'cancelling', message: '已发送取消信号' });
    }

    return res.status(200).json({ status: 'not_found', message: '任务不存在或已清理' });

  } catch (error: any) {
    res.status(200).json({ status: 'error', details: error.message });
  }
});


app.get('/api/status/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await renderQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ status: 'not_found' });
    }

    const state = await job.getState();
    const result = job.returnvalue;

    res.json({
      jobId,
      status: state,
      progress: job.progress,
      result: state === 'completed' ? result : null,
      error: job.failedReason
    });

  } catch (error) {
    res.status(500).json({ error: '查询失败' });
  }
});


app.get('/api/avatar', async (req, res) => {
  try {
    const { seed } = req.query;
    // 转发请求到 DiceBear
    const targetUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    
    const response = await axios({
      method: 'get',
      url: targetUrl,
      responseType: 'stream'
    });

    res.set('Content-Type', 'image/svg+xml');
    
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');

    response.data.pipe(res);
  } catch (error) {
    res.status(500).send('Avatar Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Internal ASR Target: ${SERVER_CONFIG.INTERNAL_SERVICES.ASR_URL}`);
});