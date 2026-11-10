const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { FIELDS, validateSnippet } = require('../lib/headerCode');

// Middleware - check login
function requireLogin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  if (req.path.startsWith('/code-snippets')) {
    return res.status(401).json({ success: false, message: 'Administrator authentication is required.' });
  }
  res.redirect('/admin/login');
}

// Redirect /admin to /admin/login or /admin/dashboard
router.get('/', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin/dashboard');
  }
  res.redirect('/admin/login');
});

// Login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Login submit
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }

  res.render('login', { error: 'Invalid username or password' });
});

// Dashboard
router.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const [leads] = await db.execute('SELECT * FROM leads ORDER BY created_at DESC');
    res.render('dashboard', { leads, dbError: null });
  } catch (error) {
    console.error('Database query error in /admin/dashboard:', error.message || error);
    res.render('dashboard', {
      leads: [],
      dbError: error.message || 'Database connection error. Please ensure MySQL is running and the "emirates_first" database exists.'
    });
  }
});

router.get('/header-code', requireLogin, (req, res) => {
  res.render('header-code');
});

router.get('/code-snippets', requireLogin, async (req, res) => {
  try {
    const [snippets] = await db.execute(
      'SELECT id, name, type, location, description, active, updated_at FROM header_code_snippets ORDER BY updated_at DESC, id DESC'
    );
    res.json({ success: true, snippets });
  } catch (error) {
    console.error('Admin header code list error:', error);
    res.status(500).json({ success: false, message: 'Could not load code snippets.' });
  }
});

router.get('/code-snippets/:id', requireLogin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
    return res.status(400).json({ success: false, message: 'Invalid snippet ID.' });
  }
  try {
    const [rows] = await db.execute(
      'SELECT id, name, type, location, code, description, active, updated_at FROM header_code_snippets WHERE id = ?',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Code snippet not found.' });
    }
    res.json({ success: true, snippet: rows[0] });
  } catch (error) {
    console.error('Admin header code detail error:', error);
    res.status(500).json({ success: false, message: 'Could not load the code snippet.' });
  }
});

router.post('/code-snippets', requireLogin, async (req, res) => {
  const { value, errors } = validateSnippet(req.body);
  if (errors.length) {
    return res.status(400).json({ success: false, message: errors.join(' ') });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO header_code_snippets (name, type, location, code, description, active) VALUES (?, ?, ?, ?, ?, ?)',
      [value.name, value.type, value.location, value.code, value.description, value.active]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Admin header code create error:', error);
    res.status(500).json({ success: false, message: 'Could not save the code snippet.' });
  }
});

router.put('/code-snippets/:id', requireLogin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
    return res.status(400).json({ success: false, message: 'Invalid snippet ID.' });
  }

  const { value, errors } = validateSnippet(req.body, { partial: true });
  if (errors.length) {
    return res.status(400).json({ success: false, message: errors.join(' ') });
  }

  try {
    const fields = FIELDS.filter(field => Object.prototype.hasOwnProperty.call(value, field));
    const assignments = fields.map(field => `${field} = ?`).join(', ');
    const params = fields.map(field => value[field]);
    const [result] = await db.execute(
      `UPDATE header_code_snippets SET ${assignments} WHERE id = ?`,
      [...params, id]
    );
    if (result.affectedRows === 0) {
      const [rows] = await db.execute('SELECT id FROM header_code_snippets WHERE id = ?', [id]);
      if (!rows.length) {
        return res.status(404).json({ success: false, message: 'Code snippet not found.' });
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Admin header code update error:', error);
    res.status(500).json({ success: false, message: 'Could not update the code snippet.' });
  }
});

router.patch('/code-snippets/:id/status', requireLogin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
    return res.status(400).json({ success: false, message: 'Invalid snippet ID.' });
  }
  if (!req.body || typeof req.body.active !== 'boolean') {
    return res.status(400).json({ success: false, message: 'Active status must be true or false.' });
  }

  try {
    const [result] = await db.execute(
      'UPDATE header_code_snippets SET active = ? WHERE id = ?',
      [req.body.active, id]
    );
    if (result.affectedRows === 0) {
      const [rows] = await db.execute('SELECT id FROM header_code_snippets WHERE id = ?', [id]);
      if (!rows.length) {
        return res.status(404).json({ success: false, message: 'Code snippet not found.' });
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Admin header code status error:', error);
    res.status(500).json({ success: false, message: 'Could not change the snippet status.' });
  }
});

router.delete('/code-snippets/:id', requireLogin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
    return res.status(400).json({ success: false, message: 'Invalid snippet ID.' });
  }

  try {
    const [result] = await db.execute('DELETE FROM header_code_snippets WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Code snippet not found.' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Admin header code delete error:', error);
    res.status(500).json({ success: false, message: 'Could not delete the code snippet.' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

//delete lead
router.delete('/leads/:id', requireLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.execute('DELETE FROM leads WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;