const jwt = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE_NAME = process.env.COOKIE_NAME || 'lex_token';

function signToken(user) {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

function setAuthCookie(res, token) {
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}

function clearAuthCookie(res) {
    res.clearCookie(COOKIE_NAME);
}

/**
 * Reads the JWT (if any) from the cookie on every request and attaches
 * `req.user` + makes `currentUser` available to all EJS views. This never
 * blocks the request — public pages should render fine either way.
 */
async function attachUser(req, res, next) {
    res.locals.currentUser = null;
    try {
        const token = req.cookies?.[COOKIE_NAME];
        if (!token) return next();

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.id);

        if (user && user.status === 'active') {
            req.user = user;
            res.locals.currentUser = user.toSafeJSON();
        }
    } catch (err) {
        // Invalid/expired token — treat as logged out silently
        clearAuthCookie(res);
    }
    next();
}

/** Blocks the request unless a valid session exists. */
function requireAuth(req, res, next) {
    if (!req.user) {
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        return res.redirect('/login');
    }
    next();
}

/** Restricts a route to one or more roles, e.g. requireRole('admin'). */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            if (req.originalUrl.startsWith('/api/')) {
                return res.status(401).json({ success: false, message: 'Authentication required.' });
            }
            return res.redirect('/login');
        }
        if (!roles.includes(req.user.role)) {
            if (req.originalUrl.startsWith('/api/')) {
                return res.status(403).json({ success: false, message: 'You do not have permission to do that.' });
            }
            return res.status(403).render('error', {
                title: 'Access Denied',
                message: 'You do not have permission to view this page.',
            });
        }
        next();
    };
}

module.exports = {
    signToken,
    setAuthCookie,
    clearAuthCookie,
    attachUser,
    requireAuth,
    requireRole,
    COOKIE_NAME,
};