/**
 * Health & Stats Routes
 * GET /api/health
 * GET /api/stats
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const endee = require('../services/endee');

router.get('/health', async (req, res) => {
  let endeeStatus = 'unknown';
  try {
    await endee.checkHealth();
    endeeStatus = 'connected';
  } catch {
    endeeStatus = 'disconnected';
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'running',
      database: 'connected',
      vectorDb: endeeStatus,
    },
  });
});

router.get('/stats', (req, res) => {
  try {
    const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const docs = db.prepare('SELECT COUNT(*) as count FROM documents').get();
    const searches = db.prepare('SELECT COUNT(*) as count FROM search_history').get();

    res.json({
      data: {
        totalUsers: users.count,
        totalDocuments: docs.count,
        totalSearches: searches.count,
        uptime: Math.floor(process.uptime()) + 's',
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Stats unavailable' });
  }
});

module.exports = router;
