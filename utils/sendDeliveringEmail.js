const nodemailer = require("nodemailer");

exports.sendDeliveringEmail = async (orderDetail) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: orderDetail.customerEmail,
    subject: "Trạng thái đơn hàng của bạn",
    html: `
      <table style="width: 100%; text-align: center;">
  <tr>
    <td align="center">
      <div style="width: fit-content; padding-bottom: 32px;">
        <div style="margin: 0 auto; margin-bottom: 16px; width: fit-content; display:flex;">
          <img
            src="https://final-asm.s3.ap-southeast-2.amazonaws.com/logo.png"
            alt=""
            style="width: 100px;"
          />
          <p style="font-size: 64px; color: black; margin: 0;">PETZ</p>
        </div>
        <div style="margin-top: 16px;">
          <p style="margin-bottom: 16px;">Xin chào Phan Tuyến Đạt, đơn hàng của bạn đang được vận chuyển.</p>
          <div style="display: inline-block; text-align: center;">
            <img
              src="https://cdn-icons-png.flaticon.com/512/2851/2851424.png"
              alt=""
              style="width: 100px; vertical-align: middle;"
            />
            <div style="display: inline-block; border-radius: 9999px; background-color: #3B82F6; color: white; padding: 8px 24px; margin-left: 8px;">
              Đang vận chuyển
            </div>
          </div>
        </div>
      </div>
    </td>
  </tr>
</table>


    `,
  };

  await transporter.sendMail(mailOptions);
};
