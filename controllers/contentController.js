const mongoose = require('mongoose');
const Content = require('../models/Content');
const catalog = require('../utils/subjectsCatalog');

async function published(type) {
    return Content.find({ type, status: 'published' }).sort({ createdAt: -1 }).lean();
}

exports.home = async (req, res) => {
    const latestNews = await Content.find({ status: 'published' })
        .sort({ createdAt: -1 })
        .limit(4)
        .lean();
    res.render('index', { active: 'home', latestNews });
};

exports.resources = async (req, res) => {
    // Count published items per (semester, subjectCode, category) so each
    // tile on the card can show how much content is actually there yet.
    const counts = await Content.aggregate([
        { $match: { type: 'resource', status: 'published', semester: { $exists: true, $ne: null } } },
        {
            $group: {
                _id: { semester: '$semester', subjectCode: '$subjectCode', category: '$resourceCategory' },
                count: { $sum: 1 },
            },
        },
    ]);

    const countMap = {};
    counts.forEach((c) => {
        const key = `${c._id.semester}|${c._id.subjectCode}|${c._id.category}`;
        countMap[key] = c.count;
    });

    res.render('resource', {
        active: 'resources',
        semesters: catalog.SEMESTERS,
        subjectsBySemester: catalog.SUBJECTS,
        categories: catalog.CATEGORIES,
        countMap,
    });
};

exports.resourceDetail = async (req, res) => {
    const { semester, subjectCode, category } = req.params;

    const semesterInfo = catalog.findSemester(semester);
    const subjectInfo = catalog.findSubject(semester, subjectCode);
    const categoryInfo = catalog.findCategory(category);

    if (!semesterInfo || !subjectInfo || !categoryInfo) {
        return res.status(404).render('error', {
            title: 'Not Found',
            message: 'That resource tile does not exist.',
        });
    }

    const items = await Content.find({
        type: 'resource',
        status: 'published',
        semester,
        subjectCode,
        resourceCategory: category,
    })
        .sort({ createdAt: -1 })
        .lean();

    res.render('resource-detail', {
        active: 'resources',
        semesterInfo,
        subjectInfo,
        categoryInfo,
        items,
    });
};

exports.books = async (req, res) => {
    const [books, bareActs] = await Promise.all([published('book'), published('bareact')]);
    res.render('books', { active: 'books', books, bareActs });
};

exports.cases = async (req, res) => {
    const items = await published('case');
    res.render('cases', { active: 'cases', items });
};

exports.caseDetail = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).render('error', { title: 'Not Found', message: 'That case law does not exist.' });
    }

    const item = await Content.findOne({ _id: id, type: 'case', status: 'published' }).lean();

    if (!item) {
        return res.status(404).render('error', { title: 'Not Found', message: 'That case law does not exist or is not published yet.' });
    }

    res.render('case-detail', { active: 'cases', item });
};

exports.internships = async (req, res) => {
    const items = await published('internship');
    res.render('internship', { active: 'internships', items });
};

exports.news = async (req, res) => {
    const items = await published('news');
    res.render('news', { active: 'news', items });
};

exports.about = async (req, res) => {
    res.render('aboutus', { active: 'about' });
};

exports.studentDashboard = async (req, res) => {
    res.render('dashboard/student-dashboard', { active: 'dashboard' });
};