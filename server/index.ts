import fs from 'fs';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { QueueEvents } from 'bullmq'; 
import { renderQueue, connection } from './queue'; 
import './worker'; 
import multer from 'multer';
import { optimizationQueue } from './queue-optimization';

const app = express();
const PORT = process.env.PORT || 8000;
const CANCEL_CHANNEL = 'RENDER_CANCEL_CHANNEL';

app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '500mb' })); 

const optimizationQueueEvents = new QueueEvents('video-optimization-queue', { connection });

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
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

const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });
app.use('/uploads', express.static(uploadDir, {
  acceptRanges: true, 
  lastModified: true, 
  etag: true 
}));
app.use('/downloads', express.static(downloadsDir));

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});