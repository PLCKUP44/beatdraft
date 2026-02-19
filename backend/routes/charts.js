const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/charts - Charts Italia e Globali
router.get('/', async (req, res) => {
  try {
    const { region = 'it' } = req.query;
    
    const chartColumn = region === 'it' ? 'chart_position_it' : 'chart_position_global';
    
    const result = await db.query(
      `SELECT 
        a.*,
        h1.monthly_listeners as current_listeners,
        h2.monthly_listeners as previous_listeners,
        (
          CASE 
            WHEN h2.monthly_listeners > 0 
            THEN ((h1.monthly_listeners - h2.monthly_listeners)::float / h2.monthly_listeners) * 100
            ELSE 0
          END
        ) as growth_percent
      FROM artists a
      LEFT JOIN LATERAL (
        SELECT monthly_listeners 
        FROM artist_stats_history 
        WHERE artist_id = a.id 
        ORDER BY recorded_at DESC 
        LIMIT 1
      ) h1 ON true
      LEFT JOIN LATERAL (
        SELECT monthly_listeners 
        FROM artist_stats_history 
        WHERE artist_id = a.id 
          AND recorded_at < NOW() - INTERVAL '7 days'
        ORDER BY recorded_at DESC 
        LIMIT 1
      ) h2 ON true
      WHERE ${chartColumn} IS NOT NULL
      ORDER BY ${chartColumn} ASC
      LIMIT 100`,
      []
    );

    const charts = result.rows.map(artist => ({
      position: artist[chartColumn],
      name: artist.name,
      emoji: artist.emoji,
      monthly_listeners: artist.current_listeners,
      growth: artist.growth_percent || 0,
      category: artist.category
    }));

    res.json({ 
      region,
      updated_at: new Date(),
      charts 
    });
  } catch (error) {
    console.error('Error fetching charts:', error);
    res.status(500).json({ error: 'Failed to fetch charts' });
  }
});

module.exports = router;
