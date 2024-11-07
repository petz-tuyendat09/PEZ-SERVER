const nodemailer = require('nodemailer');

// Tạo một transporter
export const sendEmail = () => {
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Hoặc dịch vụ email bạn đang sử dụng
        auth: {
            user: 'your-email@gmail.com', // Địa chỉ email của bạn
            pass: 'your-email-password' // Mật khẩu của bạn (hoặc mật khẩu ứng dụng)
        }
    });

    // Cấu hình email
    const mailOptions = {
        from: 'your-email@gmail.com', // Địa chỉ email gửi
        to: 'recipient-email@example.com', // Địa chỉ email nhận
        subject: 'Test Email', // Tiêu đề email
        html: `<h1>Hello!</h1>
               <p>This is a test email sent using <strong>Node.js</strong> with HTML content.</p>
               <p>Best regards,<br>Your Name</p>` // Nội dung email dưới dạng HTML
    };

    // Gửi email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('Error: ' + error);
        }
        console.log('Email sent: ' + info.response);
    });
}
