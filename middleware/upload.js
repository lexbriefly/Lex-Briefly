const multer = require('multer');
const path = require('path');

/**
 * Shared file-upload config for any route that accepts a content attachment
 * (PDFs, docs, images) — used by both CMS and Admin content-creation routes.
 *
 * - Local dev: written straight to disk under /uploads and served statically.
 * - On Vercel: the filesystem is read-only outside /tmp, so files are kept
 *   in memory here and then pushed to Vercel Blob storage inside the
 *   controller (see utils/fileToBlob.js).
 */
const storage = process.env.VERCEL
    ? multer.memoryStorage()
    : multer.diskStorage({
          destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
          filename: (req, file, cb) => {
              const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
              cb(null, `${Date.now()}-${safe}`);
          },
      });

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
        if (allowed.includes(path.extname(file.originalname).toLowerCase())) return cb(null, true);
        cb(new Error('Unsupported file type.'));
    },
});

module.exports = upload;