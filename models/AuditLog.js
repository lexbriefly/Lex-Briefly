const mongoose = require('mongoose');

/**
 * Every meaningful action (content upload, edit, publish, reject, account
 * creation/suspension, login) is written here so the Admin dashboard can
 * show a full monitoring trail of what every CMS login has done.
 */
const auditLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true,
            enum: [
                'CONTENT_CREATED',
                'CONTENT_UPDATED',
                'CONTENT_DELETED',
                'CONTENT_PUBLISHED',
                'CONTENT_REJECTED',
                'CMS_ACCOUNT_CREATED',
                'CMS_ACCOUNT_SUSPENDED',
                'CMS_ACCOUNT_REACTIVATED',
                'CMS_PASSWORD_RESET',
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