const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const router = express.Router();
const auth = require('../controllers/authController');

// Aggressive but reasonable throttling on all auth-sensitive endpoints
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts. Please try again later.' },
});

const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
});

// ---------------- Student ----------------
router.get('/signup', (req, res) => res.render('auth/student-signup', { error: null, old: {} }));
router.post(
    '/signup',
    loginLimiter,
    [
        body('name').trim().notEmpty().withMessage('Name is required.'),
        body('email').isEmail().withMessage('Enter a valid email.'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
            .matches(/\d/).withMessage('Password must contain at least one number.'),
        body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match.'),
    ],
    auth.studentSignup
);

router.get('/verify-otp', (req, res) => res.render('auth/verify-otp', { email: req.query.email || '', error: null, info: null }));
router.post('/verify-otp', otpLimiter, auth.verifyOtp);
router.post('/resend-otp', otpLimiter, auth.resendOtp);

router.get('/login', (req, res) => res.render('auth/student-login', { error: null, old: {} }));
router.post('/login', loginLimiter, auth.studentLogin);

// ---------------- CMS ----------------
router.get('/cms/login', (req, res) => res.render('auth/cms-login', { error: null, old: {} }));
router.post('/cms/login', loginLimiter, auth.cmsLogin);

// ---------------- Admin ----------------
router.get('/admin/login', (req, res) => res.render('auth/admin-login', { error: null, old: {} }));
router.post('/admin/login', loginLimiter, auth.adminLogin);

// ---------------- Shared ----------------
router.post('/logout', auth.logout);
router.get('/logout', auth.logout);

module.exports = router;