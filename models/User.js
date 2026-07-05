const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 100 },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
        },
        password: { type: String, required: true, select: false, minlength: 8 },

        role: {
            type: String,
            enum: ['student', 'cms', 'admin'],
            default: 'student',
            required: true,
        },

        // Student-only fields
        college: { type: String, trim: true },

        // CMS accounts are provisioned by an Admin, never self-signup
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        mustChangePassword: { type: Boolean, default: false },

        // Account status / moderation
        status: {
            type: String,
            enum: ['active', 'suspended', 'pending'],
            default: 'pending',
        },

        // Email / OTP verification (students)
        isVerified: { type: Boolean, default: false },
        otpHash: { type: String, select: false },
        otpExpires: { type: Date, select: false },
        otpAttempts: { type: Number, default: 0, select: false },

        // Brute-force protection
        failedLoginAttempts: { type: Number, default: 0, select: false },
        lockUntil: { type: Date, select: false },

        // Password reset
        resetTokenHash: { type: String, select: false },
        resetTokenExpires: { type: Date, select: false },

        lastLogin: { type: Date },
        lastLoginIp: { type: String },
    },
    { timestamps: true }
);

userSchema.index({ role: 1, status: 1 });

// ---- Password hashing ----
userSchema.pre('save', async function hashPassword(next) {
    if (!this.isModified('password')) return next();
    const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    this.password = await bcrypt.hash(this.password, rounds);
    next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
};

// ---- OTP handling (student email verification) ----
userSchema.methods.generateOtp = function generateOtp() {
    const otp = crypto.randomInt(100000, 999999).toString();
    this.otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
    this.otpExpires = new Date(Date.now() + minutes * 60 * 1000);
    this.otpAttempts = 0;
    return otp; // plaintext OTP is emailed, never stored
};

userSchema.methods.verifyOtp = function verifyOtp(candidate) {
    if (!this.otpHash || !this.otpExpires) return false;
    if (this.otpExpires < new Date()) return false;
    const candidateHash = crypto.createHash('sha256').update(candidate).digest('hex');
    return candidateHash === this.otpHash;
};

// ---- Account lockout ----
userSchema.methods.isLocked = function isLocked() {
    return !!(this.lockUntil && this.lockUntil > new Date());
};

userSchema.methods.registerFailedLogin = async function registerFailedLogin() {
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
    const lockoutMinutes = parseInt(process.env.LOCKOUT_MINUTES || '15', 10);

    this.failedLoginAttempts += 1;
    if (this.failedLoginAttempts >= maxAttempts) {
        this.lockUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
        this.failedLoginAttempts = 0;
    }
    await this.save();
};

userSchema.methods.registerSuccessfulLogin = async function registerSuccessfulLogin(ip) {
    this.failedLoginAttempts = 0;
    this.lockUntil = undefined;
    this.lastLogin = new Date();
    this.lastLoginIp = ip;
    await this.save();
};

// Never leak sensitive fields even if accidentally selected
userSchema.methods.toSafeJSON = function toSafeJSON() {
    const obj = this.toObject();
    delete obj.password;
    delete obj.otpHash;
    delete obj.otpExpires;
    delete obj.resetTokenHash;
    delete obj.resetTokenExpires;
    delete obj.failedLoginAttempts;
    delete obj.lockUntil;
    return obj;
};

module.exports = mongoose.model('User', userSchema);