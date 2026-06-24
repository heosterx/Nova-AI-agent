import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import memoryRoutes from './routes/memory';
import tasksRoutes from './routes/tasks';
import filesRoutes from './routes/files';
import voiceRoutes from './routes/voice';
import settingsRoutes from './routes/settings';
import healthRoutes from './routes/health';
import { errorHandler } from './middleware/errorHandler';
import { rateLimit } from './middleware/rateLimit';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/chat', rateLimit(60, 60_000));
app.use('/api/voice', rateLimit(30, 60_000));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/health', healthRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Nova API running on port ${PORT}`);
});

export default app;
