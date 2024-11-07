const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

exports.generateOTP = async () => {
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
    digits: true,
  });

  return otp;
};

exports.sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", // or your preferred email provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Set up email data
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Mã OTP đăng ký PETZ",
    html: `
     <div style="background-color: #1d1d1d; padding: 20px; color: #ffffff; font-family: Arial, sans-serif; text-align: center;">
<div>
<p style="font-size: 68px; color: #d3d3d3; margin-bottom: 30px;">
PETZ
</p>
</p>   
<h2 style="color: #5da3ff; font-size: 24px; margin-bottom: 10px;">${email},</h2>
  <p style="font-size: 16px; color: #d3d3d3; margin-bottom: 30px;">
    Đây là mã OTP của bạn:
  </p>
  <div style="background-color: #333333; padding: 20px; border-radius: 8px; display: inline-block; margin-bottom: 20px;">
    <h1 style="font-size: 36px; color: #5da3ff; margin: 0;">${otp}</h1>
  </div>
</div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
