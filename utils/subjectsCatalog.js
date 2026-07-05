const SEMESTERS = [
    { key: 'sem-1', label: 'Semester I' },
    { key: 'sem-2', label: 'Semester II' },
    { key: 'sem-3', label: 'Semester III' },
    { key: 'sem-4', label: 'Semester IV' },
    { key: 'sem-5', label: 'Semester V' },
    { key: 'sem-6', label: 'Semester VI' },
];

const SUBJECTS = {
    'sem-1': [
        { code: 'LB-106', name: 'Jurisprudence-I (Legal Method)' },
        { code: 'LB-102', name: 'Principles of Contract' },
        { code: 'LB-103', name: 'Law of Torts' },
        { code: 'LB-104', name: 'Law of Crimes-I (Bharatiya Nyaya Sanhita, 2023)' },
        { code: 'LB-105', name: 'Family Law-I' },
    ],
    'sem-2': [
        { code: 'LB-201', name: 'Law of Evidence (Bharatiya Sakshya Adhiniyam, 2023)' },
        { code: 'LB-202', name: 'Family Law-II' },
        { code: 'LB-203', name: 'Law of Crimes-II (Bharatiya Nagarik Suraksha Sanhita, 2023)' },
        { code: 'LB-204', name: 'Property Law' },
        { code: 'LB-205', name: 'Public International Law' },
    ],
    'sem-3': [
        { code: 'LB-301', name: 'Constitutional Law-I' },
        { code: 'LB-302', name: 'Code of Civil Procedure and Limitation Act' },
        { code: 'LB-303', name: 'Company Law' },
        { code: 'LB-304', name: 'Special Contracts' },
        { code: 'LB-3031', name: 'Media and Law' },
        { code: 'LB-3032', name: 'Private International Law' },
        { code: 'LB-3034', name: 'White Collar Crimes' },
    ],
    'sem-4': [
        { code: 'LB-401', name: 'Constitutional Law-II' },
        { code: 'LB-402', name: 'Administrative Law' },
        { code: 'LB-403', name: 'Labour Law' },
        { code: 'LB-404', name: 'Interpretation of Statutes and Legislative Drafting' },
        { code: 'LB-4031', name: 'Gender Justice & Feminist Jurisprudence' },
        { code: 'LB-4032', name: 'International Institutions' },
        { code: 'LB-4033', name: 'Competition Law' },
        { code: 'LB-4034', name: 'Legislative Drafting (Old)' },
        { code: 'LB-4035', name: 'Humanitarian Law and Refugee Law' },
        { code: 'LB-4036', name: 'Intellectual Property Rights Law-I' },
    ],
    'sem-5': [
        { code: 'LB-501', name: 'Moot Court Exercise and Internship' },
        { code: 'LB-502', name: 'Drafting, Pleading and Conveyance' },
        { code: 'LB-503', name: 'Industrial Law (Including IDRA)' },
        { code: 'LB-5031', name: 'Information Technology Law' },
        { code: 'LB-5033', name: 'Criminology' },
        { code: 'LB-5034', name: 'International Trade Law' },
        { code: 'LB-5035', name: 'Rent Control and Slum Clearance' },
        { code: 'LB-5036', name: 'Business Regulations' },
        { code: 'LB-5037', name: 'Intellectual Property Rights Law-II' },
        { code: 'LB-504', name: 'Principles of Taxation Law' },
    ],
    'sem-6': [
        { code: 'LB-601', name: 'Advocacy Professional Ethics and Accountancy for Lawyers' },
        { code: 'LB-602', name: 'Alternative Dispute Resolution' },
        { code: 'LB-603', name: 'Environmental Law' },
        { code: 'LB-604', name: 'Jurisprudence-II' },
        { code: 'LB-6031', name: 'Interpretation of Statutes (Old)' },
        { code: 'LB-6032', name: 'Insurance and Banking Law' },
        { code: 'LB-6033', name: 'Election Laws' },
        { code: 'LB-6034', name: 'Minor Acts and Supreme Court Rules' },
    ],
};

// The four tiles shown on every subject card. `key` is what gets stored on
// Content.resourceCategory and what appears in the detail page URL.
const CATEGORIES = [
    { key: 'case-materials', label: 'DU LLB Case Materials', icon: '📘', pageIcon: 'ph-bookmark-simple' },
    { key: 'notes', label: 'Notes & PDFs', icon: '📄', pageIcon: 'ph-file-text' },
    { key: 'pyq', label: 'PYQs & Practice Questions', icon: '📝', pageIcon: 'ph-notepad' },
    { key: 'video', label: 'Video Classes', icon: '🎥', pageIcon: 'ph-play-circle' },
];

// Templates the CMS can choose from when uploading into a tile.
const TEMPLATES = [
    { key: 'pdf', label: 'PDF / Document', hint: 'Upload a file or paste a direct PDF link.' },
    { key: 'video', label: 'Video', hint: 'Paste a YouTube / video link.' },
    { key: 'link', label: 'External Link', hint: 'Paste any external reference link.' },
];

function findSemester(semKey) {
    return SEMESTERS.find((s) => s.key === semKey) || null;
}

function findSubject(semKey, code) {
    const list = SUBJECTS[semKey] || [];
    return list.find((s) => s.code === code) || null;
}

function findCategory(catKey) {
    return CATEGORIES.find((c) => c.key === catKey) || null;
}

module.exports = {
    SEMESTERS,
    SUBJECTS,
    CATEGORIES,
    TEMPLATES,
    findSemester,
    findSubject,
    findCategory,
};