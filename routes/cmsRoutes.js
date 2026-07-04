const express = require('express');
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');
const router = express.Router();

const { requireRole } = require('../middleware/auth');
const cms = require('../controllers/cmsController');

// File uploads (PDFs, docs) are stored on disk under /uploads and served statically.
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
    filename: (req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${Date.now()}-${safe}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
        if (allowed.includes(path.extname(file.originalname).toLowerCase())) return cb(null, true);
        cb(new Error('Unsupported file type.'));
    },
});

router.use(requireRole('cms'));

router.get('/dashboard', cms.dashboard);

router.get('/change-password', cms.changePasswordPage);
router.post('/change-password', cms.changePassword);

router.post(
    '/content',
    upload.single('file'),
    [
        body('type').isIn(['resource', 'book', 'bareact', 'case', 'internship', 'news']).withMessage('Select a valid content type.'),
        body('title').trim().notEmpty().withMessage('Title is required.'),
    ],
    cms.createContent
);
router.put('/content/:id', cms.updateContent);
router.delete('/content/:id', cms.deleteContent);

module.exports = router;