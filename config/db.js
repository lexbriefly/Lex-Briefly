const mongoose = require('mongoose');

async function connectDB() {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.error('[DB] MONGO_URI is not set. Fix .env and configure it.');
        process.exit(1);
    }

    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log(`[DB] MongoDB connected: ${mongoose.connection.host}`);
    } catch (err) {
        console.error('[DB] MongoDB connection failed:', err.message);
        process.exit(1);
    }

    mongoose.connection.on('disconnected', () => {
        console.warn('[DB] MongoDB disconnected.');
    });
}

module.exports = connectDB;