// backend - index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import errorMiddleware from './middleware/errorMiddleware.js';
import uploadRouter from './router/upload.routes.js';
import doctorRouter from './router/doctors.routes.js';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MiCare API is running',
    timestamp: new Date().toISOString(),
  });
});

// Custom routes
app.use('/api/upload', uploadRouter);
app.use('/api/doctors', doctorRouter);
// app.use('/api', userRouter);
// app.use('/api/admin', adminRouter);
// app.use('/api/token', authRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'No Route Found',
  });
});

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 API Base URL: http://localhost:${PORT}/api`);
});
