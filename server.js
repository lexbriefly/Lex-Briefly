require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const fs = require('fs');

const connectDB = require('./config/db');
const { attachUser } = require('./middleware/auth');

const pageRoutes = require('./routes/pageRoutes');
const authRoutes = require('./routes/authRoutes');
const cmsRoutes = require('./routes/cmsRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Ensure the uploads directory exists before multer needs it
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ---- Security & core middleware ----
app.use(
    helmet({
        contentSecurityPolicy: false, // Tailwind CDN + Phosphor icons are loaded from third-party CDNs
    })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ---- View engine ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---- Static assets ----
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// ---- Attach logged-in user (if any) to every request/view ----
app.use(attachUser);

// ---- Routes ----
app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/cms', cmsRoutes);
app.use('/admin', adminRoutes);

// ---- 404 ----
app.use((req, res) => {
    res.status(404).render('error', { title: 'Page Not Found', message: 'The page you are looking for does not exist.' });
});

// ---- Error handler ----
app.use((err, req, res, next) => {
    console.error(err);
    if (req.originalUrl.startsWith('/api/') || req.headers.accept?.includes('application/json')) {
        return res.status(err.status || 500).json({ success: false, message: err.message || 'Server error.' });
    }
    res.status(err.status || 500).render('error', {
        title: 'Something Went Wrong',
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message,
    });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`\n🚀 LEX Briefly server running at http://localhost:${PORT}\n`);
    });
});

module.exports = app;