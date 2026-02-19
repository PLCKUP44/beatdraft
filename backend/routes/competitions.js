const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('./users');

// GET /api/competitions - Lista competizioni
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        c.*,
        COUNT(cp.id) as participant_count
      FROM competitions c
      LEFT JOIN competition_participants cp ON cp.competition_id = c.id
      GROUP BY c.id
      ORDER BY c.start_date DESC`
    );

    res.json({ competitions: result.rows });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

// GET /api/competitions/:id - Dettaglio competizione
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const compResult = await db.query(
      'SELECT * FROM competitions WHERE id = $1',
      [id]
    );

    if (compResult.rows.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    // Get leaderboard
    const leaderboardResult = await db.query(
      `SELECT 
        cp.*,
        u.username,
        COALESCE(SUM(lc.week_score), 0) as total_score
      FROM competition_participants cp
      JOIN users u ON u.id = cp.user_id
      LEFT JOIN lineup_cards lc ON lc.participant_id = cp.id
      WHERE cp.competition_id = $1
      GROUP BY cp.id, u.username
      ORDER BY total_score DESC`,
      [id]
    );

    res.json({
      competition: compResult.rows[0],
      leaderboard: leaderboardResult.rows
    });
  } catch (error) {
    console.error('Error fetching competition:', error);
    res.status(500).json({ error: 'Failed to fetch competition' });
  }
});

// POST /api/competitions/:id/join - Partecipa a competizione
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if already joined
    const existing = await db.query(
      'SELECT id FROM competition_participants WHERE competition_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Already joined this competition' });
    }

    const result = await db.query(
      `INSERT INTO competition_participants (competition_id, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [id, userId]
    );

    res.json({ participant: result.rows[0] });
  } catch (error) {
    console.error('Error joining competition:', error);
    res.status(500).json({ error: 'Failed to join competition' });
  }
});

module.exports = router;
