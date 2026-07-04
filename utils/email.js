const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
    });
}

/**
 * Sends an email if SMTP is configured; otherwise logs it to the console so
 * local development / demos still work without a mail server.
 */
async function sendEmail({ to, subject, html, text }) {
    if (!transporter) {
        console.log('\n================ [DEV EMAIL — SMTP NOT CONFIGURED] ================');
        console.log(`To:      ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body:    ${text || html}`);
        console.log('=====================================================================\n');
        return { simulated: true };
    }

    return transporter.sendMail({
        from: process.env.SMTP_FROM || '"LEX Briefly" <no-reply@lexbriefly.com>',
        to,
        subject,
        html,
        text,
    });
}

function otpEmailTemplate(name, otp) {
    return {
        subject: 'Verify your LEX Briefly account',
        text: `Hi ${name}, your verification code is ${otp}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
        html: `<p>Hi ${name},</p><p>Your LEX Briefly verification code is:</p>
               <h2 style="letter-spacing:4px">${otp}</h2>
               <p>This code expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. If you did not request this, you can ignore this email.</p>`,
    };
}

function cmsCredentialsTemplate(name, email, tempPassword) {
    return {
        subject: 'Your LEX Briefly CMS account has been created',
        text: `Hi ${name}, an administrator created a CMS account for you. Email: ${email} | Temporary password: ${tempPassword}. You must change this password on first login.`,
        html: `<p>Hi ${name},</p><p>An administrator has created a Content Management (CMS) account for you on LEX Briefly.</p>
               <p><strong>Email:</strong> ${email}<br/><strong>Temporary password:</strong> ${tempPassword}</p>
               <p>You will be required to set a new password the first time you log in. Please keep these credentials confidential.</p>`,
    };
}

module.exports = { sendEmail, otpEmailTemplate, cmsCredentialsTemplate };