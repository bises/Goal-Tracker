import cors from 'cors';
import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import calendarRoutes from './routes/calendar';
import goalRoutes from './routes/goals';
import taskRoutes from './routes/tasks';

const app = express();
const port = process.env.PORT || 3000;
const useHttps = process.env.USE_HTTPS === 'true';

app.use(cors());
app.use(express.json());

app.use('/api/goals', goalRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);

app.get('/health', (req, res) => {
  res.send('OK');
});

if (useHttps) {
  // HTTPS configuration with Tailscale certificates
  const certPath = process.env.SSL_CERT_PATH || '/certs/cert.crt';
  const keyPath = process.env.SSL_KEY_PATH || '/certs/cert.key';

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const httpsOptions = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    };

    https.createServer(httpsOptions, app).listen(port, () => {
      console.log(`HTTPS Server running on port ${port}`);
    });
  } else {
    console.error('SSL certificates not found. Falling back to HTTP.');
    http.createServer(app).listen(port, () => {
      console.log(`HTTP Server running on port ${port}`);
    });
  }
} else {
  // HTTP configuration
  http.createServer(app).listen(port, () => {
    console.log(`HTTP Server running on port ${port}`);
  });
}
