const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const Content = require('../models/Content');
const User = require('../models/User');
const { fileToBlob } = require('../utils/fileToBlob');
const catalog = require('../utils/subjectsCatalog');

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
        semesters: catalog.SEMESTERS,
        subjectsBySemester: catalog.SUBJECTS,
        categories: catalog.CATEGORIES,
        templates: catalog.TEMPLATES,
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

    res.redirect('/cms/dashboard');
};

async function rerenderDashboardWithError(req, res, statusCode, errMsg) {
    const items = await Content.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 }).limit(100);
    return res.status(statusCode).render('dashboard/cms-dashboard', {
        items,
        statusCounts: {},
        contentTypes: CONTENT_TYPES,
        semesters: catalog.SEMESTERS,
        subjectsBySemester: catalog.SUBJECTS,
        categories: catalog.CATEGORIES,
        templates: catalog.TEMPLATES,
        error: errMsg,
        success: null,
    });
}

exports.createContent = async (req, res) => {
    const errMsg = validationResult(req).array()[0]?.msg;

    try {
        const {
            type, title, subtitle, description, category, tags, link, deadline, location, publishedDate, court, citation,
            durationWeeks, stipend, startDate,
            semester, subjectCode, resourceCategory, template,
        } = req.body;

        if (errMsg) {
            return rerenderDashboardWithError(req, res, 400, errMsg);
        }

        // Resource uploads must target a real tile on the public catalog —
        // this is what lets the tile on the Resources page find the item
        // again (semester + subjectCode + resourceCategory).
        let subjectName;
        if (type === 'resource') {
            const semesterInfo = catalog.findSemester(semester);
            const subjectInfo = catalog.findSubject(semester, subjectCode);
            const categoryInfo = catalog.findCategory(resourceCategory);
            if (!semesterInfo || !subjectInfo || !categoryInfo) {
                return rerenderDashboardWithError(req, res, 400, 'Select a valid semester, subject and resource tile.');
            }
            subjectName = subjectInfo.name;

            if (template === 'pdf' && !req.file && !link) {
                return rerenderDashboardWithError(req, res, 400, 'For the PDF template, upload a file or paste a PDF link.');
            }
            if (template === 'video' && !link) {
                return rerenderDashboardWithError(req, res, 400, 'For the Video template, paste a video link.');
            }
        }

        const fileUrl = await fileToBlob(req.file);

        const content = await Content.create({
            type,
            title,
            subtitle,
            description,
            category,
            tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
            link,
            fileName: req.file && !fileUrl ? req.file.filename : undefined,
            fileUrl: fileUrl || undefined,
            meta: {
                deadline: deadline || undefined,
                location,
                durationWeeks: durationWeeks !== undefined && durationWeeks !== '' ? Number(durationWeeks) : undefined,
                stipend: stipend !== undefined && stipend !== '' ? Number(stipend) : undefined,
                startDate: startDate || undefined,
                publishedDate: publishedDate || undefined,
                court,
                citation,
            },
            semester: type === 'resource' ? semester : undefined,
            subjectCode: type === 'resource' ? subjectCode : undefined,
            subjectName: type === 'resource' ? subjectName : undefined,
            resourceCategory: type === 'resource' ? resourceCategory : undefined,
            template: type === 'resource' ? (template || 'link') : undefined,
            uploadedBy: req.user._id,
            status: 'pending',
        });

        res.redirect('/cms/dashboard?success=Content submitted for admin review.');
    } catch (err) {
        console.error(err);
        rerenderDashboardWithError(req, res, 500, 'Failed to save content.');
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

    res.json({ success: true, content });
};

exports.deleteContent = async (req, res) => {
    const content = await Content.findOneAndDelete({ _id: req.params.id, uploadedBy: req.user._id });
    if (!content) return res.status(404).json({ success: false, message: 'Not found.' });

    res.json({ success: true });
};