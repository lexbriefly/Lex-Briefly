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

    if (!process.env.EMAIL_FROM_ADDRESS) {
        throw new Error(
            'EMAIL_FROM_ADDRESS is not set in .env. Set it to an email address you have verified as a sender in your Brevo account (Settings > Senders & IP).'
        );
    }

    let res;
    try {
        res = await fetch(BREVO_API_URL, {
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
    } catch (networkErr) {
        throw new Error(`Could not reach Brevo API (network error): ${networkErr.message}`);
    }

    if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        let hint = '';
        if (res.status === 401) {
            hint = ' — check that BREVO_API_KEY is correct and active.';
        } else if (res.status === 400 && /sender/i.test(errorBody)) {
            hint = ' — check that EMAIL_FROM_ADDRESS is a verified sender in your Brevo account.';
        }
        throw new Error(`Brevo API error (${res.status}): ${errorBody}${hint}`);
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