const nodemailer = require("nodemailer");

exports.sendBookingEmail = async (email, bookingDetail) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const serviceList = bookingDetail.servicesDetails
    .map(
      (service) =>
        `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 0.5rem 0; color: #4a4a4a;">${
              service.serviceName
            }</td>
            <td style="padding: 0.5rem 0; color: #4a4a4a; text-align: right;">
              ${service.servicePrice.toLocaleString("it-IT", {
                style: "currency",
                currency: "VND",
              })}
            </td>
          </tr>
        `
    )
    .join("");

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Chi tiết đặt chỗ PETZ",
    html: `
      <div style="margin: 0 auto; width: fit-content; padding-bottom: 2rem;">
        <div style="margin: 0 auto; margin-bottom: 1rem; display: flex; width: fit-content; gap: 0.5rem;">
          <img
            src="https://final-asm.s3.ap-southeast-2.amazonaws.com/logo.png"
            alt=""
            style="width: 130px;"
          />
          <p style="font-size: 64px; color: #000000; margin: 0;">PETZ</p>
        </div>
        <div style="margin-bottom: 1rem;">
          <p style="margin: 0;">Xin chào ${bookingDetail.customerName}</p>
          <p style="margin: 0;">Bạn đã đặt lịch thành công</p>
          <p style="margin: 0;">
            Chúng tôi sẽ liên hệ để xác nhận lịch hẹn của bạn sớm nhất
          </p>
        </div>
        <div style="margin-bottom: 1rem;">
          <p style="margin: 0;">
            <span style="font-weight: bold;">Ngày đặt:</span> 
            ${new Date(bookingDetail.bookingDate).toLocaleDateString("vi-VN")}
          </p>
          <p style="margin: 0;">
            <span style="font-weight: bold;">Giờ đặt:</span> 
            ${bookingDetail.bookingHours}
          </p>
        </div>
        <div style="margin-top: 1rem;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="text-align: left; font-size: 0.75rem; font-weight: bold; color: #000000;">Dịch vụ</th>
                <th style="text-align: right; font-size: 0.75rem; font-weight: bold; color: #000000;">Giá tiền</th>
              </tr>
            </thead>
            <tbody>
              ${serviceList}
            </tbody>
          </table>
          <table style="width:100%; border-collapse: collapse">
          <tr>
                <th style="font-weight: bold; color: #4a4a4a;text-align: left">Tổng tiền:</th>
                <th style="font-weight: bold; color: #4a4a4a;text-align: right">
                  ${bookingDetail.totalPrice.toLocaleString("it-IT", {
                    style: "currency",
                    currency: "VND",
                  })}
                </th>
          </tr>
          </table>
        </div>
      </div>;
      `,
  };

  await transporter.sendMail(mailOptions);
};
