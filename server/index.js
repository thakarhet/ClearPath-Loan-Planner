
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import calculations from './routes/calculations.js';
import auth from './routes/auth.js';

const app = express();
const port = Number(process.env.PORT || 5001);
const production = process.env.NODE_ENV === 'production';
const enforceHttps = production && process.env.RENDER === 'true';

// Resolve the project root from server/index.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../dist');

if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
  throw new Error(
    'Set JWT_SECRET to a random value of at least 32 bytes. Generate one with: openssl rand -base64 48'
  );
}

if (process.env.TRUST_PROXY && process.env.TRUST_PROXY !== '0') {
  app.set('trust proxy', Number(process.env.TRUST_PROXY));
}

app.disable('x-powered-by');

app.use(
  helmet({
    strictTransportSecurity: production
      ? { maxAge: 15552000, includeSubDomains: true }
      : false,

    contentSecurityPolicy: {
      directives: {
        'upgrade-insecure-requests': enforceHttps ? [] : null,
      },
    },
  })
);

app.use((req, res, next) => {
  if (enforceHttps && !req.secure) {
    return res.status(426).json({ message: 'HTTPS is required.' });
  }
  next();
});

app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) =>
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
);

app.use('/api/auth', auth);
app.use('/api/calculations', calculations);

// Serve the built React frontend in production
if (production) {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use((error, _req, res, _next) => {
  console.error(error.message);
  res.status(error.status || 500).json({
    message: error.status ? error.message : 'Something went wrong. Please try again.',
  });
});

if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) =>
      console.error('MongoDB connection failed:', error.message)
    );
} else {
  console.warn('MONGODB_URI is not set. Account and save features require MongoDB.');
}

app.listen(port, () => console.log(`API ready on port ${port}`));
