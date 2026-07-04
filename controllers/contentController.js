const Content = require('../models/Content');

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
    const items = await published('resource');
    res.render('resource', { active: 'resources', items });
};

exports.books = async (req, res) => {
    const [books, bareActs] = await Promise.all([published('book'), published('bareact')]);
    res.render('books', { active: 'books', books, bareActs });
};

exports.cases = async (req, res) => {
    const items = await published('case');
    res.render('cases', { active: 'cases', items });
};

exports.internships = async (req, res) => {
    const items = await published('internship');
    res.render('internship', { active: 'internships', items });
};

exports.news = async (req, res) => {
    const items = await published('news');
    res.render('news', { active: 'news', items });
};

exports.studentDashboard = async (req, res) => {
    res.render('dashboard/student-dashboard', { active: 'dashboard' });
};