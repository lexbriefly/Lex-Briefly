async function fileToBlob(file) {
    if (!file || !process.env.VERCEL) return null;
    const { put } = require('@vercel/blob');
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const blob = await put(`${Date.now()}-${safe}`, file.buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
}

module.exports = { fileToBlob };