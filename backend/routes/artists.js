const express = require('express');
const router = express.Router();
const db = require('../config/database');
const spotifyService = require('../services/spotifyService');

// GET /api/artists - Lista tutti gli artisti con dati aggiornati
router.get('/', async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        a.*,
        (
          SELECT monthly_listeners 
          FROM artist_stats_history 
          WHERE artist_id = a.id 
          ORDER BY recorded_at DESC 
          LIMIT 1
        ) as current_listeners
      FROM artists a
      ${category ? 'WHERE category = $1' : ''}
      ORDER BY monthly_listeners DESC
      LIMIT $${category ? 2 : 1}
    `;

    const params = category ? [category, limit] : [limit];
    const result = await db.query(query, params);

    // Calculate growth for each artist
    const artists = await Promise.all(
      result.rows.map(async (artist) => {
        const growth = await spotifyService.calculateGrowth(artist.id);
        return { ...artist, weekly_growth: growth };
      })
    );

    res.json({ artists, count: artists.length });
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
});

// GET /api/artists/:id - Dettaglio singolo artista
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM artists WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    const artist = result.rows[0];
    const growth = await spotifyService.calculateGrowth(artist.id);

    // Get history (last 30 days)
    const historyResult = await db.query(
      `SELECT * FROM artist_stats_history 
       WHERE artist_id = $1 
         AND recorded_at >= NOW() - INTERVAL '30 days'
       ORDER BY recorded_at ASC`,
      [id]
    );

    res.json({
      artist: { ...artist, weekly_growth: growth },
      history: historyResult.rows
    });
  } catch (error) {
    console.error('Error fetching artist:', error);
    res.status(500).json({ error: 'Failed to fetch artist' });
  }
});

// POST /api/artists/sync - Forza sync di un artista
router.post('/sync/:spotifyId', async (req, res) => {
  try {
    const { spotifyId } = req.params;
    const artist = await spotifyService.syncArtist(spotifyId);
    
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found on Spotify' });
    }

    res.json({ message: 'Artist synced successfully', artist });
  } catch (error) {
    console.error('Error syncing artist:', error);
    res.status(500).json({ error: 'Failed to sync artist' });
  }
});

module.exports = router;
