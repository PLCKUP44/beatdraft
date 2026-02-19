const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/artists', require('./routes/artists'));
app.use('/api/charts', require('./routes/charts'));
app.use('/api/competitions', require('./routes/competitions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/lineup', require('./routes/lineup'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cron job: Aggiorna dati Spotify ogni giorno alle 3:00 AM
cron.schedule('0 3 * * *', async () => {
  console.log('🔄 Running Spotify sync...');
  try {
    const { syncAllArtists } = require('./services/spotifyService');
    await syncAllArtists();
    console.log('✅ Spotify sync completed');
  } catch (error) {
    console.error('❌ Spotify sync failed:', error);
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BeatDraft API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎵 Spotify sync scheduled daily at 3:00 AM`);
});

module.exports = app;
