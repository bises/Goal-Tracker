import fs from 'fs';
import http from 'http';
import https from 'https';
import app from './app';

const port = process.env.PORT || 3000;
const useHttps = process.env.USE_HTTPS === 'true';

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
