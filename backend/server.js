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
// Setup endpoint (TEMPORARY - remove after first use)
app.get('/setup', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const { pool } = require('./config/database');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'scripts', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    
    // Insert sample data
    const artists = [
      ['06HL4z0CvFAxyc27GXpf02', 'Taylor Swift', '🎤', 95000000, 92000000, 'Mondiale', false, 'Pop', 1],
      ['3TVXtAsR1Inumwj472S9r4', 'Drake', '🦉', 82000000, 78000000, 'Mondiale', false, 'Hip Hop', 3],
      ['4q3ewBCX7sLwd24euuV69X', 'Bad Bunny', '🐰', 112000000, 67000000, 'Mondiale', false, 'Reggaeton', 2],
      ['1McMsnEElThX1knmY4oliG', 'Sfera Ebbasta', '🔵', 8000000, 5200000, 'Grande', false, 'Trap', 5],
      ['36l4JROocfWBrKODx1XmOu', 'Led Zeppelin', '🎸', 16000000, 22000000, 'Leggendario', true, 'Rock', null]
    ];
    
    for (const [spotifyId, name, emoji, listeners, followers, category, legacy, genre, chartPos] of artists) {
      await pool.query(
        `INSERT INTO artists 
         (spotify_id, name, emoji, monthly_listeners, followers, category, is_legacy, genre, chart_position_global)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (spotify_id) DO NOTHING`,
        [spotifyId, name, emoji, listeners, followers, category, legacy, genre, chartPos]
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Database initialized successfully! Remove this endpoint now.' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
// Start server
app.listen(PORT, () => {
  console.log(`🚀 BeatDraft API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎵 Spotify sync scheduled daily at 3:00 AM`);
});

module.exports = app;
