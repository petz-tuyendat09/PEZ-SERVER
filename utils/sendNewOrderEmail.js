const nodemailer = require("nodemailer");
const User = require("../models/User");

exports.sendNewOrderEmail = async () => {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Lấy giờ hiện tại
    const currentHour = new Date().getHours();

    // Tìm tất cả user có ca làm hiện tại
    const users = await User.find({
      userShift: {
        $exists: true,
        $not: { $size: 0 },
      },
    });

    for (const user of users) {
      const isInCurrentShift = user.userShift.some((shift) => {
        const [startHour] = shift.startTime.split(":").map(Number);
        const [endHour] = shift.endTime.split(":").map(Number);

        if (startHour <= endHour) {
          // Ca làm không qua đêm
          return currentHour >= startHour && currentHour < endHour;
        } else {
          // Ca làm qua đêm (ví dụ: 22:00 - 06:00)
          return currentHour >= startHour || currentHour < endHour;
        }
      });

      if (isInCurrentShift) {
        // Gửi email
        const mailOptions = {
          from: "your-email@gmail.com",
          to: user.userEmail,
          subject: "Thông báo đơn hàng mới",
          html: `
              <div style="margin: 0 auto; width: fit-content; padding-bottom: 32px;">
                <div style="margin: 0 auto; margin-bottom: 16px; display: flex; width: fit-content; gap: 8px;">
                  <img
                    src="https://final-asm.s3.ap-southeast-2.amazonaws.com/logo.png"
                    alt=""
                    style="width: 100px;"
                  />
                  <p style="font-size: 64px; color: black; margin: 0;">PETZ</p>
                </div>
                <div style="margin-top: 16px;">
                  <p style="margin-top: 16px; margin-bottom: 16px;">Xin chào seller, bạn có đơn hàng mới trong ca làm hiện tại.</p>
                  <a
                    href="facebook.com"
                    style="margin-top: 16px; display: block; border-radius: 9999px; background-color: #AD3E39; color: white; text-align: center; padding: 8px 24px; text-decoration: none;"
                  >
                    Kiểm tra ngay
                  </a>
                </div>
              </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Đã gửi email đến ${user.userEmail}`);
      }
    }
  } catch (error) {
    console.error("Error khi gửi email:", error);
  }
};
