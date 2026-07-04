const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const cms = require('../controllers/cmsController');

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