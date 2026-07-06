# LEX Briefly — Reorganized Project

This is a project into a standard Express + EJS + MongoDB format for helping student in their acedmic life.

This site help law student in manage the acedmic life and content related to theiir cources.
## File structure

```
LEX-Briefly/
├── server.js                # entry point
├── package.json
├── .env.example             # copy to .env and fill in real values
├── config/
│   └── db.js                 # Mongo connection
├── middleware/
│   ├── upload.js
│   └── auth.js                # attachUser / requireAuth / requireRole / JWT
├── models/
│   ├── User.js
│   ├── Content.js             # (was content.js)
│   └── AuditLog.js            # (was AuditLogs.js)
├── controllers/
│   ├── authController.js
│   ├── adminController.js
│   ├── cmsController.js
│   └── contentController.js
├── routes/
│   ├── pageRoutes.js
│   ├── authRoutes.js
│   ├── cmsRoutes.js
│   └── adminRoutes.js
├── utils/
│   ├── email.js
│   ├── fileToBlob.js
│   ├── seedAdmin.js
│   └── subjectsCatalog.js
├── views/                     # EJS templates (frontend, server-rendered)
│   ├── error.ejs
│   ├── index.ejs
│   ├── books.ejs
│   ├── cases.ejs
│   ├── case-detail.ejs
│   ├── resource.ejs
│   ├── resource-detail.ejs
│   ├── internship.ejs
│   ├── news.ejs
│   ├── auth/
│   │   ├── student-signup.ejs
│   │   ├── student-login.ejs
│   │   ├── verify-otp.ejs
│   │   ├── cms-login.ejs
│   │   ├── admin-login.ejs
│   │   └── change-password.ejs
│   ├── dashboard/
│   │   ├── student-dashboard.ejs
│   │   ├── cms-dashboard.ejs
│   │   ├── admin-dashboard.ejs
│   │   ├── admin-content-log.ejs
│   │   └── admin-audit-log.ejs
│   └── partials/
│       ├── head.ejs
│       ├── header.ejs
│       ├── footer.ejs
│       ├── sidebar.ejs
│       ├── internship-card.ejs
│       ├── mobile-drawer.ejs
│       ├── scripts.ejs
│       └── content-card.ejs
└── public/                    # static assets served at /css, /js
    ├── css/main.css
    ├── images
    └── js/
        ├── main.js
        ├── page-search.js
        └── books.js
```

I verified this structure by installing dependencies and confirming every backend file resolves its `require()` paths with no errors, and every `.ejs` view compiles cleanly.

## How to run it

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the env template and fill in real values (at minimum `MONGO_URI` and
   `JWT_SECRET`):
   ```bash
   cp .env.example .env
   ```
3. Seed the first admin account (reads `ADMIN_*` vars from `.env`):
   ```bash
   npm run seed:admin
   ```
4. Start the server:
   ```bash
   npm start        # production
   npm run dev       # nodemon, auto-restart on changes
   ```
5. Visit `http://localhost:5000`.
