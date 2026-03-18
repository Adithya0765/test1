const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Copying the EXACT logic from api/send-otp.js
async function run() {
    const email = 'mndabhinavsai@gmail.com';
    const otp = crypto.randomInt(100000, 999999).toString();

    const SMTP_CONFIG = {
        host: 'smtpout.secureserver.net',
        port: 465,
        secure: true,
        auth: {
            user: 'admin@qauliumai.in',
            pass: 'Host@nirvana.in' // Using the pass I saw in previous context
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    };

    const SMTP_FROM = '"Qaulium AI" <admin@qauliumai.in>';

    console.log("Creating transporter...");
    const transporter = nodemailer.createTransport(SMTP_CONFIG);

    try {
        console.log(`Sending OTP email to ${email}...`);
        await transporter.sendMail({
            from: SMTP_FROM,
            to: email,
            subject: 'TEST: Your Qualium AI Verification Code',
            html: `<p>Your code is: <b>${otp}</b></p>`
        });
        console.log("Email sent successfully!");
    } catch (e) {
        console.error("Failed to send email:", e);
    }
}

run();
