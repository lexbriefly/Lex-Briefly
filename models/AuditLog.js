const mongoose = require('mongoose');

/**
 * Login-security trail only: signup, email verification, and successful /
 * failed login attempts. Content moderation and CMS-account actions are
 * NOT logged here — Content already carries uploadedBy/reviewedBy/status/
 * reviewedAt, which covers "who did what" for that side of the system.
 */
const auditLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true,
            enum: [
                'USER_LOGIN',
                'USER_LOGIN_FAILED',
                'USER_SIGNUP',
                'USER_VERIFIED',
            ],
            index: true,
        },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        performedByRole: { type: String },
        performedByLabel: { type: String }, // denormalised name/email snapshot, survives account deletion

        targetType: { type: String }, // 'Content' | 'User'
        targetId: { type: mongoose.Schema.Types.ObjectId },

        details: { type: String, trim: true, maxlength: 2000 },
        ip: { type: String },
    },
    { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);