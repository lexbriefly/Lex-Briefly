const mongoose = require('mongoose');

/**
 * A single generic schema powers every content page (Resources, Books & Bare
 * Acts, Case Laws, Internships, News). The `type` field determines which
 * page the item appears on, so CMS staff use one unified upload form and
 * the admin gets one unified moderation queue.
 */
const contentSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['resource', 'book', 'bareact', 'case', 'internship', 'news'],
            required: true,
            index: true,
        },

        title: { type: String, required: true, trim: true, maxlength: 200 },
        subtitle: { type: String, trim: true, maxlength: 200 }, // author / court / organisation / source
        description: { type: String, trim: true, maxlength: 3000 },

        category: { type: String, trim: true }, // e.g. Semester 3, Constitutional Law, Corporate
        tags: [{ type: String, trim: true }],

        // External link or uploaded file path (served from /uploads)
        link: { type: String, trim: true },
        fileName: { type: String, trim: true },

        // Optional extra metadata that only applies to some types
        meta: {
            deadline: Date, // internships
            location: String, // internships
            publishedDate: Date, // news
            court: String, // cases
            citation: String, // cases
        },

        status: {
            type: String,
            enum: ['pending', 'published', 'rejected'],
            default: 'pending',
            index: true,
        },
        rejectionReason: { type: String, trim: true },

        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: { type: Date },

        views: { type: Number, default: 0 },
    },
    { timestamps: true }
);

contentSchema.index({ title: 'text', description: 'text', subtitle: 'text', tags: 'text' });

module.exports = mongoose.model('Content', contentSchema);