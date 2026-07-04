const express = require('express');
const router = express.Router();

const { requireRole } = require('../middleware/auth');
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

module.exports = router;