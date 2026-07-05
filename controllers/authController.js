const { validationResult } = require('express-validator');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sendEmail, otpEmailTemplate } = require('../utils/email');
const { signToken, setAuthCookie, clearAuthCookie } = require('../middleware/auth');

function firstValidationError(req) {
    const errors = validationResult(req);
    return errors.isEmpty() ? null : errors.array()[0].msg;
}

async function log(action, req, extra = {}) {
    try {
        await AuditLog.create({
            action,
            performedBy: req.user?._id,
            performedByRole: req.user?.role || extra.role,
            performedByLabel: extra.label || req.user?.email,
            details: extra.details,
            ip: req.ip,
            targetType: extra.targetType,
            targetId: extra.targetId,
        });
    } catch (e) {
        console.error('[AuditLog] failed to write:', e.message);
    }
}

// ---------------------------------------------------------------------------
// STUDENT SIGN UP  →  creates unverified account + emails a 6-digit OTP
// ---------------------------------------------------------------------------
exports.studentSignup = async (req, res) => {
    const errMsg = firstValidationError(req);
    if (errMsg) return res.status(400).render('auth/student-signup', { error: errMsg, old: req.body });

    try {
        const { name, email, college, password } = req.body;
        const existing = await User.findOne({ email: email.toLowerCase() });

        if (existing) {
            if (existing.isVerified) {
                return res.status(409).render('auth/student-signup', {
                    error: 'An account with this email already exists. Try logging in instead.',
                    old: req.body,
                });
            }
            // Account exists but was never verified (likely a previous signup
            // whose verification email failed to send) — regenerate the OTP
            // and let them continue instead of dead-ending on "already exists."
            const otp = existing.generateOtp();
            await existing.save();

            const tpl = otpEmailTemplate(existing.name, otp);
            let emailWarning = null;
            try {
                await sendEmail({ to: existing.email, ...tpl });
            } catch (emailErr) {
                console.error('[signup] Failed to send OTP email:', emailErr.message);
                const detail = process.env.NODE_ENV === 'production' ? '' : ` (${emailErr.message})`;
                emailWarning = `Your account is ready, but we could not send the verification email right now. Use "Resend it" below once email delivery is fixed.${detail}`;
            }

            res.cookie('pending_verification_email', existing.email, { httpOnly: true, maxAge: 15 * 60 * 1000 });
            return res.render('auth/verify-otp', {
                email: existing.email,
                error: emailWarning,
                info: emailWarning ? null : 'We emailed you a 6-digit verification code.',
            });
        }

        const user = new User({
            name,
            email: email.toLowerCase(),
            college,
            password,
            role: 'student',
            status: 'active',
        });

        const otp = user.generateOtp();
        await user.save();

        await log('USER_SIGNUP', req, { role: 'student', label: user.email, targetType: 'User', targetId: user._id });

        const tpl = otpEmailTemplate(name, otp);
        let emailWarning = null;
        try {
            await sendEmail({ to: user.email, ...tpl });
        } catch (emailErr) {
            // The account is already saved at this point — a failed email
            // must NOT be reported as a failed signup, or the person is
            // stuck (retrying just hits "account already exists").
            console.error('[signup] Failed to send OTP email:', emailErr.message);
            const detail = process.env.NODE_ENV === 'production' ? '' : ` (${emailErr.message})`;
            emailWarning = `Your account was created, but we could not send the verification email right now. Use "Resend it" below once email delivery is fixed.${detail}`;
        }

        res.cookie('pending_verification_email', user.email, { httpOnly: true, maxAge: 15 * 60 * 1000 });
        return res.render('auth/verify-otp', {
            email: user.email,
            error: emailWarning,
            info: emailWarning ? null : 'We emailed you a 6-digit verification code.',
        });
    } catch (err) {
        console.error(err);
        return res.status(500).render('auth/student-signup', { error: 'Something went wrong. Please try again.', old: req.body });
    }
};

// ---------------------------------------------------------------------------
// OTP VERIFICATION
// ---------------------------------------------------------------------------
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+otpHash +otpExpires +otpAttempts');
        if (!user) {
            return res.status(400).render('auth/verify-otp', { email, error: 'Account not found.', info: null });
        }
        if (user.isVerified) {
            return res.redirect('/login');
        }
        if (user.otpAttempts >= 5) {
            return res.status(429).render('auth/verify-otp', { email, error: 'Too many incorrect attempts. Please sign up again to receive a new code.', info: null });
        }

        if (!user.verifyOtp(otp)) {
            user.otpAttempts += 1;
            await user.save();
            return res.status(400).render('auth/verify-otp', { email, error: 'Invalid or expired code. Please try again.', info: null });
        }

        user.isVerified = true;
        user.otpHash = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;
        await user.save();

        await log('USER_VERIFIED', req, { role: 'student', label: user.email, targetType: 'User', targetId: user._id });

        const token = signToken(user);
        setAuthCookie(res, token);
        res.clearCookie('pending_verification_email');
        return res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        return res.status(500).render('auth/verify-otp', { email, error: 'Something went wrong verifying your code.', info: null });
    }
};

exports.resendOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email: (email || '').toLowerCase() });
        if (!user || user.isVerified) {
            return res.render('auth/verify-otp', { email, error: null, info: 'If that account needs verification, a new code has been sent.' });
        }
        const otp = user.generateOtp();
        await user.save();
        const tpl = otpEmailTemplate(user.name, otp);
        try {
            await sendEmail({ to: user.email, ...tpl });
        } catch (emailErr) {
            console.error('[resendOtp] Failed to send OTP email:', emailErr.message);
            const detail = process.env.NODE_ENV === 'production' ? '' : ` (${emailErr.message})`;
            return res.render('auth/verify-otp', {
                email,
                error: `We generated a new code, but could not send the email right now. Please check the email configuration and try again.${detail}`,
                info: null,
            });
        }
        return res.render('auth/verify-otp', { email, error: null, info: 'A new verification code has been sent.' });
    } catch (err) {
        console.error(err);
        return res.status(500).render('auth/verify-otp', { email, error: 'Could not resend code right now.', info: null });
    }
};

// ---------------------------------------------------------------------------
// GENERIC LOGIN — shared logic for student / cms / admin, role is enforced
// per-route so a student can't log into the CMS panel and vice versa.
// ---------------------------------------------------------------------------
async function performLogin({ email, password, expectedRole, req }) {
    const user = await User.findOne({ email: (email || '').toLowerCase(), role: expectedRole })
        .select('+password +failedLoginAttempts +lockUntil');

    if (!user) {
        await log('USER_LOGIN_FAILED', req, { role: expectedRole, label: email, details: 'No matching account' });
        return { ok: false, error: 'Invalid credentials.' };
    }

    if (user.isLocked()) {
        return { ok: false, error: 'Account temporarily locked due to too many failed attempts. Try again later.' };
    }

    if (user.status === 'suspended') {
        return { ok: false, error: 'This account has been suspended. Contact an administrator.' };
    }

    const match = await user.comparePassword(password);
    if (!match) {
        await user.registerFailedLogin();
        await log('USER_LOGIN_FAILED', req, { role: expectedRole, label: email, details: 'Bad password' });
        return { ok: false, error: 'Invalid credentials.' };
    }

    if (expectedRole === 'student' && !user.isVerified) {
        return { ok: false, error: 'Please verify your email before logging in.', unverified: true };
    }

    await user.registerSuccessfulLogin(req.ip);
    return { ok: true, user };
}

exports.studentLogin = async (req, res) => {
    const { email, password } = req.body;
    const result = await performLogin({ email, password, expectedRole: 'student', req });

    if (!result.ok) {
        if (result.unverified) {
            return res.render('auth/verify-otp', { email, error: null, info: 'Please verify your email to continue. Enter the code we sent you, or resend it below.' });
        }
        return res.status(401).render('auth/student-login', { error: result.error, old: { email } });
    }

    req.user = result.user;
    await log('USER_LOGIN', req);
    setAuthCookie(res, signToken(result.user));
    return res.redirect('/dashboard');
};

exports.cmsLogin = async (req, res) => {
    const { email, password } = req.body;
    const result = await performLogin({ email, password, expectedRole: 'cms', req });

    if (!result.ok) {
        return res.status(401).render('auth/cms-login', { error: result.error, old: { email } });
    }

    req.user = result.user;
    await log('USER_LOGIN', req);
    setAuthCookie(res, signToken(result.user));

    if (result.user.mustChangePassword) {
        return res.redirect('/cms/change-password');
    }
    return res.redirect('/cms/dashboard');
};

exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;
    const result = await performLogin({ email, password, expectedRole: 'admin', req });

    if (!result.ok) {
        return res.status(401).render('auth/admin-login', { error: result.error, old: { email } });
    }

    req.user = result.user;
    await log('USER_LOGIN', req);
    setAuthCookie(res, signToken(result.user));
    return res.redirect('/admin/dashboard');
};

exports.logout = (req, res) => {
    clearAuthCookie(res);
    res.redirect('/');
};