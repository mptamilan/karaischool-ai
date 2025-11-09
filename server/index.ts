import express from 'express';

const app = express();

app.get('/api/health-check', (req, res) => {
  res.status(200).json({ message: 'The server is running correctly!' });
});

// Vercel can handle an exported Express app instance directly.
export default app;
