const express = require('express');
const router = express.Router();

const content = require('../controllers/contentController');
const { requireAuth } = require('../middleware/auth');

router.get('/', content.home);
router.get('/resource.html', content.resources);
router.get('/resource/:semester/:subjectCode/:category', content.resourceDetail);
router.get('/books.html', content.books);
router.get('/book/:id', content.bookDetail);
router.get('/cases.html', content.cases);
router.get('/case/:id', content.caseDetail);
router.get('/internship.html', content.internships);
router.get('/news.html', content.news);
router.get('/aboutus.html', content.about);

router.get('/dashboard', requireAuth, content.studentDashboard);

module.exports = router;