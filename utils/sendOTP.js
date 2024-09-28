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
     subject: "Your OTP Code",
     text: `Your OTP code is: ${otp}`,
   };
 
   await transporter.sendMail(mailOptions);
 };