const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function sendEmail({ to, subject, html, text }) {
    if (!process.env.BREVO_API_KEY) {
        console.log('\n================ [DEV EMAIL — BREVO_API_KEY NOT SET] ================');
        console.log(`To:      ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body:    ${text || html}`);
        console.log('=======================================================================\n');
        return { simulated: true };
    }

    const res = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'api-key': process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
            sender: {
                name: process.env.EMAIL_FROM_NAME || 'LEX Briefly',
                email: process.env.EMAIL_FROM_ADDRESS,
            },
            to: [{ email: to }],
            subject,
            htmlContent: html || `<p>${text}</p>`,
            textContent: text,
        }),
    });

    if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        throw new Error(`Brevo API error (${res.status}): ${errorBody}`);
    }

    return res.json();
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