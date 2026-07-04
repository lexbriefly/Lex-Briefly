/**
 * Creates (or updates) the primary Admin account from environment values.
 * Run with: npm run seed:admin
 * This is the ONLY way an admin account should ever be created — there is
 * no public admin signup route, by design.
 */
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const mongoose = require('mongoose');

(async () => {
    await connectDB();

    const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || 'Super Admin';

    if (!email || !password) {
        console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
        process.exit(1);
    }

    let admin = await User.findOne({ email });
    if (admin) {
        console.log(`Admin account already exists for ${email}. No changes made.`);
    } else {
        admin = new User({
            name,
            email,
            password,
            role: 'admin',
            status: 'active',
            isVerified: true,
        });
        await admin.save();
        console.log(`✅ Admin account created for ${email}`);
    }

    await mongoose.disconnect();
    process.exit(0);
})().catch((err) => {
    console.error('Failed to seed admin:', err);
    process.exit(1);
});