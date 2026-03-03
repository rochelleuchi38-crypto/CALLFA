const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const normalizeRole = (role) => (role || '').toLowerCase();

const toNewsAuthorRole = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === 'farmer') return 'Farmer';
  if (normalized === 'president') return 'President';
  return null;
};

const toAnnouncementAuthorRole = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === 'president') return 'President';
  if (normalized === 'admin') return 'Admin';
  return null;
};

const newsUploadDir = path.join(__dirname, '..', 'uploads', 'news');
if (!fs.existsSync(newsUploadDir)) {
  fs.mkdirSync(newsUploadDir, { recursive: true });
}
const announcementsUploadDir = path.join(__dirname, '..', 'uploads', 'announcements');
if (!fs.existsSync(announcementsUploadDir)) {
  fs.mkdirSync(announcementsUploadDir, { recursive: true });
}

const newsImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, newsUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `news-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const uploadNewsImage = multer({
  storage: newsImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, GIF, and WEBP images are allowed.'));
    }
    cb(null, true);
  }
}).single('image');

const announcementImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, announcementsUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `announcement-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const uploadAnnouncementImage = multer({
  storage: announcementImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, GIF, and WEBP images are allowed.'));
    }
    cb(null, true);
  }
}).single('image');

// Public/Authenticated listing:
// - Farmers can see published + their own submissions
// - Presidents/Admin can see all statuses
router.get('/news', verifyToken, async (req, res) => {
  try {
    const role = normalizeRole(req.user?.role);
    const isModerator = role === 'president' || role === 'admin';

    let query = `
      SELECT n.id, n.title, n.content, n.image, n.author_id, n.author_role, n.status,
             n.reviewed_by, n.reviewed_at, n.rejection_reason, n.created_at, n.updated_at,
             COALESCE(f.full_name, CONCAT('User #', n.author_id)) AS author_name,
             f.profile_picture AS author_profile
      FROM news n
      LEFT JOIN farmers f ON f.id = n.author_id
    `;
    const params = [];

    if (!isModerator) {
      query += ' WHERE n.status = ? OR n.author_id = ?';
      params.push('published', req.user.id);
    }

    query += ' ORDER BY n.created_at DESC';

    const [rows] = await pool.execute(query, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching news:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch news' });
  }
});

// News posting rules:
// - farmer: can create, status = pending (needs approval)
// - president: can create, status = published (auto publish)
// - admin: cannot create
router.post('/news', verifyToken, (req, res, next) => {
  uploadNewsImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { title, content } = req.body;
    const role = normalizeRole(req.user?.role);
    const authorRole = toNewsAuthorRole(role);

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'title and content are required' });
    }

    if (!authorRole) {
      return res.status(403).json({
        success: false,
        message: 'Only Farmer or President can create news. Admin cannot create news.'
      });
    }

    const status = role === 'president' ? 'published' : 'pending';
    const image = req.file ? `/uploads/news/${req.file.filename}` : null;

    const [result] = await pool.execute(
      `INSERT INTO news (title, content, image, author_id, author_role, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, content, image, req.user.id, authorRole, status]
    );

    return res.status(201).json({
      success: true,
      message: status === 'published'
        ? 'News posted and published successfully.'
        : 'News submitted for approval.',
      data: {
        id: result.insertId,
        status
      }
    });
  } catch (err) {
    console.error('Error creating news:', err);
    return res.status(500).json({ success: false, message: 'Failed to create news' });
  }
});

// News edit rules:
// - farmer: only own news
// - president: can edit any news
// - admin: cannot edit news
router.post('/news/update', verifyToken, (req, res, next) => {
  uploadNewsImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const role = normalizeRole(req.user?.role);
    const newsId = Number(req.body?.news_id);
    const title = String(req.body?.title || '').trim();
    const content = String(req.body?.content || '').trim();

    if (!Number.isInteger(newsId) || newsId <= 0) {
      return res.status(400).json({ success: false, message: 'news_id is required.' });
    }
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'title and content are required' });
    }

    const [rows] = await pool.execute(
      `SELECT id, author_id, status, image, reviewed_by, reviewed_at, rejection_reason
       FROM news
       WHERE id = ?`,
      [newsId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'News not found.' });
    }

    const existing = rows[0];
    if (role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin cannot edit news.' });
    }

    if (role === 'farmer') {
      const isOwner = Number(existing.author_id) === Number(req.user.id);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Farmers can only edit their own news.'
        });
      }
    } else if (role !== 'president') {
      return res.status(403).json({ success: false, message: 'You are not allowed to edit news.' });
    }

    const nextImage = req.file ? `/uploads/news/${req.file.filename}` : existing.image;
    const resetRejectedToPending = role === 'farmer' && existing.status === 'rejected';

    if (resetRejectedToPending) {
      await pool.execute(
        `UPDATE news
         SET title = ?, content = ?, image = ?, status = 'pending',
             reviewed_by = NULL, reviewed_at = NULL, rejection_reason = NULL, updated_at = NOW()
         WHERE id = ?`,
        [title, content, nextImage, newsId]
      );
    } else {
      await pool.execute(
        `UPDATE news
         SET title = ?, content = ?, image = ?, updated_at = NOW()
         WHERE id = ?`,
        [title, content, nextImage, newsId]
      );
    }

    if (req.file && existing.image && existing.image.startsWith('/uploads/news/')) {
      const oldFilePath = path.join(__dirname, '..', existing.image.replace(/^\//, ''));
      fs.promises.unlink(oldFilePath).catch(() => {});
    }

    return res.json({
      success: true,
      message: 'News updated successfully.'
    });
  } catch (err) {
    console.error('Error updating news:', err);
    return res.status(500).json({ success: false, message: 'Failed to update news' });
  }
});

// Review pending news:
// - president only can publish or reject
router.patch('/news/:id/review', verifyToken, async (req, res) => {
  try {
    const role = normalizeRole(req.user?.role);
    if (role !== 'president') {
      return res.status(403).json({
        success: false,
        message: 'Only President can review news.'
      });
    }

    const { action, rejection_reason = null } = req.body;
    if (!['published', 'rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "action must be 'published' or 'rejected'"
      });
    }

    if (action === 'rejected' && !rejection_reason) {
      return res.status(400).json({
        success: false,
        message: 'rejection_reason is required when rejecting news'
      });
    }

    const [existing] = await pool.execute('SELECT id, status FROM news WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }
    if (existing[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending news can be reviewed.'
      });
    }

    await pool.execute(
      `UPDATE news
       SET status = ?, reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ?
       WHERE id = ? AND status = 'pending'`,
      [action, req.user.id, action === 'rejected' ? rejection_reason : null, req.params.id]
    );

    return res.json({
      success: true,
      message: action === 'published' ? 'News published.' : 'News rejected.'
    });
  } catch (err) {
    console.error('Error reviewing news:', err);
    return res.status(500).json({ success: false, message: 'Failed to review news' });
  }
});

const deleteNewsByRules = async (req, res, newsId) => {
  const role = normalizeRole(req.user?.role);

  if (!Number.isInteger(newsId) || newsId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid news id.' });
  }

  const [rows] = await pool.execute(
    'SELECT id, author_id, status, image FROM news WHERE id = ?',
    [newsId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'News not found.' });
  }

  const item = rows[0];
  if (role === 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin cannot delete news posts.'
    });
  }

  if (role === 'farmer') {
    const isOwner = Number(item.author_id) === Number(req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Farmers can only delete their own news.'
      });
    }
  } else if (role !== 'president') {
    return res.status(403).json({
      success: false,
      message: 'You are not allowed to delete news.'
    });
  }

  await pool.execute('DELETE FROM news WHERE id = ?', [newsId]);

  if (item.image && item.image.startsWith('/uploads/news/')) {
    const filePath = path.join(__dirname, '..', item.image.replace(/^\//, ''));
    fs.promises.unlink(filePath).catch(() => {});
  }

  return res.json({ success: true });
};

// News delete via POST body:
// POST /news/delete
// body: { news_id }
router.post('/news/delete', verifyToken, async (req, res) => {
  try {
    const newsId = Number(req.body?.news_id);
    return await deleteNewsByRules(req, res, newsId);
  } catch (err) {
    console.error('Error deleting news:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete news' });
  }
});

// News deletion rules:
// - farmer: only own news
// - president: can delete any news
// - admin: cannot delete news
router.delete('/news/:id', verifyToken, async (req, res) => {
  try {
    const newsId = Number(req.params.id);
    return await deleteNewsByRules(req, res, newsId);
  } catch (err) {
    console.error('Error deleting news:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete news' });
  }
});

router.get('/announcements', verifyToken, async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.id, a.title, a.content, a.image, a.author_id, a.author_role, a.created_at, a.updated_at,
              COALESCE(f.full_name, CONCAT('User #', a.author_id)) AS author_name,
              f.profile_picture AS author_profile
       FROM announcements a
       LEFT JOIN farmers f ON f.id = a.author_id
       ORDER BY a.created_at DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching announcements:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
  }
});

// Announcement posting rules:
// - president: can create
// - admin: can create
// - farmer: cannot create
router.post('/announcements', verifyToken, (req, res, next) => {
  uploadAnnouncementImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { title, content } = req.body;
    const role = normalizeRole(req.user?.role);
    const authorRole = toAnnouncementAuthorRole(role);

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'title and content are required' });
    }

    if (!authorRole) {
      return res.status(403).json({
        success: false,
        message: 'Only President or Admin can create announcements.'
      });
    }

    const image = req.file ? `/uploads/announcements/${req.file.filename}` : null;

    const [result] = await pool.execute(
      `INSERT INTO announcements (title, content, image, author_id, author_role)
       VALUES (?, ?, ?, ?, ?)`,
      [title, content, image, req.user.id, authorRole]
    );

    return res.status(201).json({
      success: true,
      message: 'Announcement posted successfully.',
      data: { id: result.insertId }
    });
  } catch (err) {
    console.error('Error creating announcement:', err);
    return res.status(500).json({ success: false, message: 'Failed to create announcement' });
  }
});

const deleteAnnouncementByRules = async (req, res, announcementId) => {
  const role = normalizeRole(req.user?.role);

  if (!Number.isInteger(announcementId) || announcementId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid announcement id.' });
  }

  if (!['president', 'admin'].includes(role)) {
    return res.status(403).json({
      success: false,
      message: 'Only President or Admin can delete announcements.'
    });
  }

  const [rows] = await pool.execute(
    'SELECT id, image FROM announcements WHERE id = ?',
    [announcementId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Announcement not found.' });
  }

  const item = rows[0];
  await pool.execute('DELETE FROM announcements WHERE id = ?', [announcementId]);

  if (item.image && item.image.startsWith('/uploads/announcements/')) {
    const filePath = path.join(__dirname, '..', item.image.replace(/^\//, ''));
    fs.promises.unlink(filePath).catch(() => {});
  }

  return res.json({ success: true });
};

// Announcement delete via POST body:
// POST /announcements/delete
// body: { announcement_id } (also accepts { news_id } for compatibility)
router.post('/announcements/delete', verifyToken, async (req, res) => {
  try {
    const announcementId = Number(req.body?.announcement_id ?? req.body?.news_id);
    return await deleteAnnouncementByRules(req, res, announcementId);
  } catch (err) {
    console.error('Error deleting announcement:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete announcement' });
  }
});

// Announcement deletion rules:
// - president/admin: can delete any announcement
// - farmer: cannot delete announcements
router.delete('/announcements/:id', verifyToken, async (req, res) => {
  try {
    const announcementId = Number(req.params.id);
    return await deleteAnnouncementByRules(req, res, announcementId);
  } catch (err) {
    console.error('Error deleting announcement:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete announcement' });
  }
});

module.exports = router;

