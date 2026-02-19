const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('./users');

// GET /api/lineup/:competitionId - Get user's lineup for competition
router.get('/:competitionId', authenticateToken, async (req, res) => {
  try {
    const { competitionId } = req.params;
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT 
        lc.*,
        uc.rarity,
        a.name, a.emoji, a.category
      FROM lineup_cards lc
      JOIN competition_participants cp ON cp.id = lc.participant_id
      JOIN user_cards uc ON uc.id = lc.card_id
      JOIN artists a ON a.id = uc.artist_id
      WHERE cp.competition_id = $1 AND cp.user_id = $2`,
      [competitionId, userId]
    );

    res.json({ lineup: result.rows });
  } catch (error) {
    console.error('Error fetching lineup:', error);
    res.status(500).json({ error: 'Failed to fetch lineup' });
  }
});

// POST /api/lineup/:competitionId - Set/update lineup
router.post('/:competitionId', authenticateToken, async (req, res) => {
  try {
    const { competitionId } = req.params;
    const userId = req.user.userId;
    const { cardId, slotCategory } = req.body;

    // Get participant
    const partResult = await db.query(
      'SELECT id FROM competition_participants WHERE competition_id = $1 AND user_id = $2',
      [competitionId, userId]
    );

    if (partResult.rows.length === 0) {
      return res.status(404).json({ error: 'Not participating in this competition' });
    }

    const participantId = partResult.rows[0].id;

    // Upsert lineup card
    const result = await db.query(
      `INSERT INTO lineup_cards (participant_id, card_id, slot_category)
       VALUES ($1, $2, $3)
       ON CONFLICT (participant_id, slot_category)
       DO UPDATE SET card_id = $2
       RETURNING *`,
      [participantId, cardId, slotCategory]
    );

    res.json({ lineupCard: result.rows[0] });
  } catch (error) {
    console.error('Error setting lineup:', error);
    res.status(500).json({ error: 'Failed to set lineup' });
  }
});

// DELETE /api/lineup/:competitionId/:slotCategory - Remove from lineup
router.delete('/:competitionId/:slotCategory', authenticateToken, async (req, res) => {
  try {
    const { competitionId, slotCategory } = req.params;
    const userId = req.user.userId;

    const result = await db.query(
      `DELETE FROM lineup_cards lc
       USING competition_participants cp
       WHERE lc.participant_id = cp.id
         AND cp.competition_id = $1
         AND cp.user_id = $2
         AND lc.slot_category = $3`,
      [competitionId, userId, slotCategory]
    );

    res.json({ deleted: result.rowCount > 0 });
  } catch (error) {
    console.error('Error removing from lineup:', error);
    res.status(500).json({ error: 'Failed to remove from lineup' });
  }
});

module.exports = router;
