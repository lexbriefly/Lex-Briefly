const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const admin = require('../controllers/adminController');

router.use(requireRole('admin'));

router.get('/dashboard', admin.dashboard);
router.get('/content-log', admin.contentLog);
router.get('/audit-log', admin.auditLog);

router.post('/cms-accounts', admin.createCmsAccount);
router.post('/cms-accounts/:id/toggle', admin.toggleCmsStatus);
router.post('/cms-accounts/:id/reset-password', admin.resetCmsPassword);

router.post('/content/:id/publish', admin.publishContent);
router.post('/content/:id/reject', admin.rejectContent);

router.post(
    '/content',
    upload.single('file'),
    [
        body('type').isIn(['resource', 'book', 'bareact', 'case', 'internship', 'news']).withMessage('Select a valid content type.'),
        body('title').trim().notEmpty().withMessage('Title is required.'),
    ],
    admin.createContent
);
router.delete('/content/:id', admin.deleteContent);

module.exports = router;