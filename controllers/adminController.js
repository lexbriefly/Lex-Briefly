const crypto = require('crypto');
const User = require('../models/User');
const Content = require('../models/Content');
const AuditLog = require('../models/AuditLog');
const { sendEmail, cmsCredentialsTemplate } = require('../utils/email');
const { fileToBlob } = require('../utils/fileToBlob');
const catalog = require('../utils/subjectsCatalog');

const CONTENT_TYPES = ['resource', 'book', 'bareact', 'case', 'internship', 'news'];

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

exports.dashboard = async (req, res) => {
    const [pendingContent, cmsAccounts, studentCount, contentStats, recentLogs] = await Promise.all([
        Content.find({ status: 'pending' }).populate('uploadedBy', 'name email').sort({ createdAt: -1 }).limit(50),
        User.find({ role: 'cms' }).sort({ createdAt: -1 }),
        User.countDocuments({ role: 'student' }),
        Content.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        AuditLog.find().sort({ createdAt: -1 }).limit(30),
    ]);

    const statusCounts = { pending: 0, published: 0, rejected: 0 };
    contentStats.forEach((c) => { statusCounts[c._id] = c.count; });

    res.render('dashboard/admin-dashboard', {
        pendingContent,
        cmsAccounts,
        studentCount,
        statusCounts,
        recentLogs,
        contentTypes: CONTENT_TYPES,
        semesters: catalog.SEMESTERS,
        subjectsBySemester: catalog.SUBJECTS,
        categories: catalog.CATEGORIES,
        templates: catalog.TEMPLATES,
        error: null,
        success: req.query.success || null,
    });
};

// ---- CMS account provisioning (Admin issues CMS credentials) ----
exports.createCmsAccount = async (req, res) => {
    try {
        const { name, email } = req.body;
        const existing = await User.findOne({ email: (email || '').toLowerCase() });
        if (existing) {
            return res.redirect('/admin/dashboard?success=' + encodeURIComponent('That email is already registered.'));
        }

        const tempPassword = crypto.randomBytes(6).toString('base64url'); // e.g. "kQ8f3ZaT"
        const cmsUser = await User.create({
            name,
            email: (email || '').toLowerCase(),
            password: tempPassword,
            role: 'cms',
            status: 'active',
            isVerified: true,
            mustChangePassword: true,
            createdBy: req.user._id,
        });

        const tpl = cmsCredentialsTemplate(name, cmsUser.email, tempPassword);
        await sendEmail({ to: cmsUser.email, ...tpl });

        await log('CMS_ACCOUNT_CREATED', req, { targetType: 'User', targetId: cmsUser._id, details: cmsUser.email });

        res.redirect('/admin/dashboard?success=' + encodeURIComponent(`CMS account created for ${cmsUser.email}. Credentials emailed.`));
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard?success=' + encodeURIComponent('Failed to create CMS account.'));
    }
};

exports.toggleCmsStatus = async (req, res) => {
    const cmsUser = await User.findOne({ _id: req.params.id, role: 'cms' });
    if (!cmsUser) return res.status(404).json({ success: false, message: 'Not found.' });

    cmsUser.status = cmsUser.status === 'active' ? 'suspended' : 'active';
    await cmsUser.save();

    await log(cmsUser.status === 'active' ? 'CMS_ACCOUNT_REACTIVATED' : 'CMS_ACCOUNT_SUSPENDED', req, {
        targetType: 'User', targetId: cmsUser._id, details: cmsUser.email,
    });

    res.json({ success: true, status: cmsUser.status });
};

exports.resetCmsPassword = async (req, res) => {
    const cmsUser = await User.findOne({ _id: req.params.id, role: 'cms' });
    if (!cmsUser) return res.status(404).json({ success: false, message: 'Not found.' });

    const tempPassword = crypto.randomBytes(6).toString('base64url');
    cmsUser.password = tempPassword;
    cmsUser.mustChangePassword = true;
    await cmsUser.save();

    const tpl = cmsCredentialsTemplate(cmsUser.name, cmsUser.email, tempPassword);
    await sendEmail({ to: cmsUser.email, ...tpl });

    await log('CMS_PASSWORD_RESET', req, { targetType: 'User', targetId: cmsUser._id, details: 'Admin-initiated reset' });

    res.json({ success: true });
};

// ---- Content moderation: Admin reviews everything CMS uploads ----
exports.publishContent = async (req, res) => {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ success: false, message: 'Not found.' });

    content.status = 'published';
    content.reviewedBy = req.user._id;
    content.reviewedAt = new Date();
    content.rejectionReason = undefined;
    await content.save();

    await log('CONTENT_PUBLISHED', req, { targetType: 'Content', targetId: content._id, details: content.title });
    res.json({ success: true });
};

exports.rejectContent = async (req, res) => {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ success: false, message: 'Not found.' });

    content.status = 'rejected';
    content.reviewedBy = req.user._id;
    content.reviewedAt = new Date();
    content.rejectionReason = req.body.reason || 'Did not meet publishing guidelines.';
    await content.save();

    await log('CONTENT_REJECTED', req, { targetType: 'Content', targetId: content._id, details: content.title });
    res.json({ success: true });
};

exports.contentLog = async (req, res) => {
    const items = await Content.find().populate('uploadedBy', 'name email').populate('reviewedBy', 'name email').sort({ updatedAt: -1 }).limit(200);
    res.render('dashboard/admin-content-log', { items });
};

exports.auditLog = async (req, res) => {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(300);
    res.render('dashboard/admin-audit-log', { logs });
};

// ---- Admin can also add content directly, same fields as CMS uploads ----
// Unlike CMS uploads (which go to 'pending' for admin review), content the
// Admin creates publishes immediately — there's no one else to review it.
exports.createContent = async (req, res) => {
    try {
        const {
            type, title, subtitle, description, category, tags, link, deadline, location, publishedDate, court, citation,
            durationWeeks, stipend, startDate,
            semester, subjectCode, resourceCategory, template,
        } = req.body;

        if (!type || !CONTENT_TYPES.includes(type) || !title || !title.trim()) {
            return res.redirect('/admin/dashboard?success=' + encodeURIComponent('Please provide a valid type and title.'));
        }

        let subjectName;
        if (type === 'resource') {
            const semesterInfo = catalog.findSemester(semester);
            const subjectInfo = catalog.findSubject(semester, subjectCode);
            const categoryInfo = catalog.findCategory(resourceCategory);
            if (!semesterInfo || !subjectInfo || !categoryInfo) {
                return res.redirect('/admin/dashboard?success=' + encodeURIComponent('Select a valid semester, subject and resource tile.'));
            }
            subjectName = subjectInfo.name;
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
            status: 'published',
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
        });

        await log('CONTENT_CREATED', req, { targetType: 'Content', targetId: content._id, details: `${type}: ${title} (admin, auto-published)` });

        res.redirect('/admin/dashboard?success=' + encodeURIComponent(`"${title}" published.`));
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard?success=' + encodeURIComponent('Failed to save content.'));
    }
};

exports.deleteContent = async (req, res) => {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) return res.status(404).json({ success: false, message: 'Not found.' });

    await log('CONTENT_DELETED', req, { targetType: 'Content', targetId: content._id, details: `${content.title} (deleted by admin)` });
    res.json({ success: true });
};