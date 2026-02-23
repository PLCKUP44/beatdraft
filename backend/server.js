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
// Sync endpoint (TEMPORARY)
app.get('/sync', async (req, res) => {
  try {
    const spotifyService = require('./services/spotifyService');
    await spotifyService.syncAllArtists();
    res.json({ success: true, message: 'Sync completed!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// Sync endpoint (TEMPORARY - remove after use)
app.get('/sync', async (req, res) => {
  try {
    console.log('🔄 Manual Spotify sync triggered...');
    const spotifyService = require('./services/spotifyService');
    await spotifyService.syncAllArtists();
    res.json({ 
      success: true, 
      message: 'Spotify sync completed successfully!'
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
// POPULATE DATABASE - 30 artisti (TEMPORARY)
app.post('/populate-db', async (req, res) => {
  try {
    const { pool } = require('./config/database');
    
    const artists = [
      // Top Italiani
      ['1PZLQWxc2IaOlv5L24MZsB', 'Geolier', '🌊', 'Rap', false],
      ['3Isy6kedDrgPYoTS1dazA9', 'Sfera Ebbasta', '🔵', 'Trap', false],
      ['0z4gvV4rjIZ9wHck67ucSV', 'Marracash', '🦁', 'Rap', false],
      ['5EvkfMBEn5e8dQtKRdhuZd', 'Lazza', '⚡', 'Rap', false],
      ['4LLpKhyESsyAXpc4laK94U', 'Blanco', '⚪', 'Pop Rap', false],
      ['7ltDVBr6mKbRvohxheJ9h1', 'Annalisa', '🎵', 'Pop', false],
      ['4V8Sr092TqfHkfAA5fXXqG', 'Tiziano Ferro', '🇮🇹', 'Pop', false],
      ['2iJa7hfWPHVT0DdCpDFcVP', 'Mahmood', '🌹', 'Pop', false],
      ['5rUaKdN10VFlZbgJNi5bSE', 'Ghali', '🦅', 'Rap', false],
      ['6J7biCazzYhU3gM9j1wfid', 'Rkomi', '🎤', 'Rap', false],
      
      // Top Internazionali
      ['06HL4z0CvFAxyc27GXpf02', 'Taylor Swift', '🎤', 'Pop', false],
      ['1Xyo4u8uXC1ZmMpatF05PJ', 'The Weeknd', '🌙', 'R&B', false],
      ['3TVXtAsR1Inumwj472S9r4', 'Drake', '🦉', 'Hip Hop', false],
      ['4q3ewBCX7sLwd24euuV69X', 'Bad Bunny', '🐰', 'Reggaeton', false],
      ['6eUKZXaKkcviH0Ku9w2n3V', 'Ed Sheeran', '🎸', 'Pop', false],
      ['66CXWjxzNUsdJxJ2JdwvnR', 'Ariana Grande', '💝', 'Pop', false],
      ['1URnnhqYAYcrqrcwql10ft', 'Billie Eilish', '🌊', 'Alternative', false],
      ['246dkjvS1zLTtiykXe5h60', 'Post Malone', '🎧', 'Hip Hop', false],
      ['6M2wZ9GZgrQXHCFfjv46we', 'Dua Lipa', '💃', 'Pop', false],
      ['1uNFoZAHBGtllmzznpCI3s', 'Justin Bieber', '🎤', 'Pop', false],
      ['0du5cEVh5yTK9QJze8zA0C', 'Bruno Mars', '🌟', 'Pop', false],
      ['6KImCVD70vtIoJWnq6nGn3', 'Harry Styles', '🍉', 'Pop', false],
      ['5K4W6rqBFWDnAN6FQUkS6x', 'Kanye West', '🐻', 'Hip Hop', false],
      ['7dGJo4pcD2V6oG8kP0tJRR', 'Eminem', '🎙️', 'Hip Hop', false],
      ['5pKCCKE2ajJHZ9KAiaK11H', 'Rihanna', '💎', 'Pop', false],
      ['4gzpq5DPGxSnKTe4SA8HAU', 'Coldplay', '❄️', 'Alternative', false],
      ['53XhwfbYqKCa1cC15pYq2q', 'Imagine Dragons', '🐉', 'Alternative', false],
      ['04gDigrS5kc9YWfZHwBETP', 'Maroon 5', '🎤', 'Pop Rock', false],
      ['36l4JROocfWBrKODx1XmOu', 'Led Zeppelin', '🎸', 'Rock', true],
      ['3WrFJ7ztbogyGnTHbHJFl2', 'The Beatles', '🪲', 'Rock', true]
    ];
    
    let inserted = 0;
    for (const [spotifyId, name, emoji, genre, isLegacy] of artists) {
      const result = await pool.query(
        `INSERT INTO artists (spotify_id, name, emoji, genre, is_legacy, monthly_listeners, category)
         VALUES ($1, $2, $3, $4, $5, 1000000, 'Sconosciuto')
         ON CONFLICT (spotify_id) DO NOTHING
         RETURNING id`,
        [spotifyId, name, emoji, genre, isLegacy]
      );
      if (result.rowCount > 0) inserted++;
    }
    
    res.json({ success: true, message: `Added ${inserted} artists! Now run /sync-all` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// SYNC COMPLETO (TEMPORARY)
app.get('/sync-all', async (req, res) => {
  try {
    const spotifyService = require('./services/spotifyService');
    const { pool } = require('./config/database');
    
    const artistsResult = await pool.query('SELECT id, spotify_id FROM artists');
    const artists = artistsResult.rows;
    
    let synced = 0;
    for (const artist of artists) {
      try {
        await spotifyService.syncArtist(artist.spotify_id);
        synced++;
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed: ${artist.spotify_id}`);
      }
    }
    
    res.json({ success: true, message: `Synced ${synced}/${artists.length} artists!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
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
