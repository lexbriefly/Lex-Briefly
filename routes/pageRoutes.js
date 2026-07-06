const express = require('express');
const router = express.Router();

const content = require('../controllers/contentController');
const { requireAuth } = require('../middleware/auth');

router.get('/', content.home);
router.get('/resource', content.resources);
router.get('/resource/:semester/:subjectCode/:category', content.resourceDetail);
router.get('/books', content.books);
router.get('/book/:id', content.bookDetail);
router.get('/cases', content.cases);
router.get('/case/:id', content.caseDetail);
router.get('/internship', content.internships);
router.get('/news', content.news);
router.get('/aboutus', content.about);

router.get('/dashboard', requireAuth, content.studentDashboard);

module.exports = router;