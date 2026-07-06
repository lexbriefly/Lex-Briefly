const express = require('express');
const router = express.Router();

const content = require('../controllers/contentController');
const { requireAuth } = require('../middleware/auth');

router.get('/', content.home);
router.get('/resource', content.resources);
router.get('/resource/:semester/:subjectCode/:category', content.resourceDetail);
router.get('/books', content.books);
router.get('/cases', content.cases);
router.get('/case/:id', content.caseDetail);
router.get('/internship', content.internships);
router.get('/news', content.news);
router.get('/aboutus', content.about);

// Backward-compatible redirects for old .html links (bookmarks, external links, etc.)
router.get('/resource.html', (req, res) => res.redirect(301, '/resource'));
router.get('/books.html', (req, res) => res.redirect(301, '/books'));
router.get('/cases.html', (req, res) => res.redirect(301, '/cases'));
router.get('/internship.html', (req, res) => res.redirect(301, '/internship'));
router.get('/news.html', (req, res) => res.redirect(301, '/news'));
router.get('/aboutus.html', (req, res) => res.redirect(301, '/aboutus'));

router.get('/dashboard', requireAuth, content.studentDashboard);

module.exports = router;