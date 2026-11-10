const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/submit', async (req, res) => {
  try {
    const { name, phone, message } = req.body;
    const email = req.body.email || '';

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone required' });
    }

    await db.execute(
      'INSERT INTO leads (name, email, phone, message) VALUES (?, ?, ?, ?)',
      [name, email, phone, message || null]
    );

    res.json({ success: true, message: 'Thank you! We will contact you soon.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/header-code', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const [snippets] = await db.execute(
      'SELECT name, type, location, code FROM header_code_snippets WHERE active = 1 ORDER BY id ASC'
    );
    res.json({ success: true, snippets });
  } catch (error) {
    console.error('Public header code query error:', error);
    res.status(500).json({ success: false, message: 'Website code is temporarily unavailable.' });
  }
});

module.exports = router;