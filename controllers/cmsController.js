const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const Content = require('../models/Content');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

async function log(action, req, extra = {}) {
    try {
        await AuditLog.create({
            action,
            performedBy: req.user?._id,
            performedByRole: req.user?.role,
            performedByLabel: req.user?.email,
            details: extra.details,
            ip: req.ip,
            targetType: extra.targetType,
            targetId: extra.targetId,
        });
    } catch (e) {
        console.error('[AuditLog] failed to write:', e.message);
    }
}

const CONTENT_TYPES = ['resource', 'book', 'bareact', 'case', 'internship', 'news'];

exports.dashboard = async (req, res) => {
    const items = await Content.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 }).limit(100);
    const counts = await Content.aggregate([
        { $match: { uploadedBy: req.user._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const statusCounts = { pending: 0, published: 0, rejected: 0 };
    counts.forEach((c) => { statusCounts[c._id] = c.count; });

    res.render('dashboard/cms-dashboard', {
        items,
        statusCounts,
        contentTypes: CONTENT_TYPES,
        error: null,
        success: req.query.success || null,
    });
};

exports.changePasswordPage = (req, res) => {
    res.render('auth/change-password', { error: null, forced: !!req.user.mustChangePassword });
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const match = await user.comparePassword(currentPassword);
    if (!match) {
        return res.status(400).render('auth/change-password', { error: 'Current password is incorrect.', forced: !!user.mustChangePassword });
    }
    if (newPassword.length < 8) {
        return res.status(400).render('auth/change-password', { error: 'New password must be at least 8 characters.', forced: !!user.mustChangePassword });
    }
    if (newPassword !== confirmPassword) {
        return res.status(400).render('auth/change-password', { error: 'Passwords do not match.', forced: !!user.mustChangePassword });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();
    await log('CMS_PASSWORD_RESET', req, { targetType: 'User', targetId: user._id, details: 'Self-service password change' });

    res.redirect('/cms/dashboard');
};

exports.createContent = async (req, res) => {
    const errMsg = validationResult(req).array()[0]?.msg;

    try {
        const { type, title, subtitle, description, category, tags, link, deadline, location, publishedDate, court, citation } = req.body;

        if (errMsg) {
            const items = await Content.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 }).limit(100);
            return res.status(400).render('dashboard/cms-dashboard', {
                items, statusCounts: {}, contentTypes: CONTENT_TYPES, error: errMsg, success: null,
            });
        }

        const content = await Content.create({
            type,
            title,
            subtitle,
            description,
            category,
            tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
            link,
            fileName: req.file ? req.file.filename : undefined,
            meta: { deadline: deadline || undefined, location, publishedDate: publishedDate || undefined, court, citation },
            uploadedBy: req.user._id,
            status: 'pending',
        });

        await log('CONTENT_CREATED', req, { targetType: 'Content', targetId: content._id, details: `${type}: ${title}` });

        res.redirect('/cms/dashboard?success=Content submitted for admin review.');
    } catch (err) {
        console.error(err);
        const items = await Content.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 }).limit(100);
        res.status(500).render('dashboard/cms-dashboard', {
            items, statusCounts: {}, contentTypes: CONTENT_TYPES, error: 'Failed to save content.', success: null,
        });
    }
};

exports.updateContent = async (req, res) => {
    const content = await Content.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!content) return res.status(404).json({ success: false, message: 'Not found.' });

    const editableFields = ['title', 'subtitle', 'description', 'category', 'link'];
    editableFields.forEach((f) => {
        if (req.body[f] !== undefined) content[f] = req.body[f];
    });
    if (req.body.tags !== undefined) {
        content.tags = req.body.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    // Any edit sends it back to pending so the Admin re-reviews it
    content.status = 'pending';
    content.reviewedBy = undefined;
    content.reviewedAt = undefined;
    await content.save();

    await log('CONTENT_UPDATED', req, { targetType: 'Content', targetId: content._id, details: content.title });

    res.json({ success: true, content });
};

exports.deleteContent = async (req, res) => {
    const content = await Content.findOneAndDelete({ _id: req.params.id, uploadedBy: req.user._id });
    if (!content) return res.status(404).json({ success: false, message: 'Not found.' });

    await log('CONTENT_DELETED', req, { targetType: 'Content', targetId: content._id, details: content.title });
    res.json({ success: true });
};