import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { petRouter } from './routes/pet.routes';
import { recordRouter } from './routes/record.routes';
import { statsRouter } from './routes/stats.routes';
import { titleRouter } from './routes/title.routes';
import { reminderRouter } from './routes/reminder.routes';
import { pushRouter } from './routes/push.routes';
import { shareRouter } from './routes/share.routes';
import { exportRouter } from './routes/export.routes';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://hydratepet.app', 'https://www.hydratepet.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    skip: (req) => req.url === '/api/health' || req.url === '/health',
  }));
}
app.use(requestLogger);

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/pets', petRouter);
app.use('/api/records', recordRouter);
app.use('/api/stats', statsRouter);
app.use('/api/titles', titleRouter);
app.use('/api/reminders', reminderRouter);
app.use('/api/push', pushRouter);
app.use('/api/share', shareRouter);
app.use('/api/export', exportRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
    },
  });
});

// Global error handler
app.use(errorHandler);

export default app;
