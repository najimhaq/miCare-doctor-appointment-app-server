// backend - index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import errorMiddleware from './middleware/errorMiddleware.js';
import uploadRouter from './router/upload.routes.js';
import doctorRouter from './router/doctors.routes.js';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import appointmentRoutes from './router/appointmentRoutes.js';

const app = express();
const PORT = process.env.PORT || 8000;

// ✅ Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000 } : false,
  })
);

// ✅ Compression
app.use(compression());

// ✅ CORS - Production ready
const corsOptions = {
  origin: process.env.NEXT_PUBLIC_API_FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// ✅ Rate Limiting (প্রোডাকশনে জরুরি)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ✅ Better Auth
app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MiCare API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
  });
});

// Custom routes
app.use('/api/appointments', appointmentRoutes);
app.use('/api/upload', uploadRouter);
app.use('/api/all-doctors', doctorRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use(errorMiddleware);

// ✅ Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
