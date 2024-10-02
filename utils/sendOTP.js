const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

exports.generateOTP = async () =>  {
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true, 
    });

    return otp;
}


exports.sendOtpEmail = async (email,otp) => { 
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
     text: `Mã OTP của bạn là: ${otp}
    OTP sẽ hết hạn trong vòng 5 phút.`,
   };
 
   await transporter.sendMail(mailOptions);
 };