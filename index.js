// backend - index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import errorMiddleware from './middleware/errorMiddleware.js';


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
    message: 'StayNest API is running',
    timestamp: new Date().toISOString(),
  });
});

// Custom routes
// app.use("/api/doctors", doctorRoutes);
// app.use("/api/appointments", appointmentRoutes);
// app.use("/api/patients", patientRoutes);


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
