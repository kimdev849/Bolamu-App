import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from './lib/config';
import { errorHandler } from './middleware/error-handler';
import routes from './routes';

dotenv.config();

const app = express();

// ──────────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://localhost:60453',
    'http://127.0.0.1:4200',
    'https://bolamu-api.onrender.com',
    'https://bolamu-app.onrender.com',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ──────────────────────────────────────────────────
// Health check
// ──────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Bolamu API opérationnelle',
    version: '1.0.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ──────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────
app.use('/api', routes);

// ──────────────────────────────────────────────────
// Error handler
// ──────────────────────────────────────────────────
app.use(errorHandler);

// ──────────────────────────────────────────────────
// Démarrage
// ──────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`\n  🏥  Bolamu API — PSR PharmaFlow`);
    console.log(`  ─────────────────────────────────`);
    console.log(`  🚀  Serveur démarré sur le port ${config.port}`);
    console.log(`  🌍  Environnement : ${config.nodeEnv}`);
    console.log(`  📡  API : http://localhost:${config.port}/api`);
    console.log(`  🩺  Health : http://localhost:${config.port}/api/health\n`);
  });
}

export default app;
