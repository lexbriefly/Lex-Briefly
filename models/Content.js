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
        subtitle: { type: String, trim: true }, // author / court / organisation / source
        description: { type: String, trim: true },

        category: { type: String, trim: true }, // e.g. Semester 3, Constitutional Law, Corporate
        tags: [{ type: String, trim: true }],

        // Only used when type === 'resource'. Ties an upload to one of the
        // four tiles (Case Materials / Notes & PDFs / PYQs / Video Classes)
        // on a specific subject card of the Resources page.
        semester: { type: String, trim: true, index: true }, // e.g. 'sem-3'
        subjectCode: { type: String, trim: true, index: true }, // e.g. 'LB-301'
        subjectName: { type: String, trim: true }, // denormalised for display
        resourceCategory: {
            type: String,
            enum: ['case-materials', 'notes', 'pyq', 'video'],
            index: true,
        },
        // Which upload template the CMS staffer picked. Drives how the tile
        // renders the item (embed-style video button vs. document download).
        template: {
            type: String,
            enum: ['pdf', 'video', 'link'],
            default: 'link',
        },

        // External link pasted by CMS/admin (e.g. YouTube link, external PDF)
        link: { type: String, trim: true },
        // Uploaded file stored on disk, served from /uploads/<fileName>
        fileName: { type: String, trim: true },
        // Uploaded file stored on Vercel Blob (or any cloud storage), a full public URL
        fileUrl: { type: String, trim: true },

        // Optional extra metadata that only applies to some types
        meta: {
            deadline: Date, // internships — last date to apply
            location: String, // internships
            durationWeeks: Number, // internships — preferred duration, in weeks
            stipend: Number, // internships — allowance, in Rupees
            startDate: Date, // internships — when the internship begins
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