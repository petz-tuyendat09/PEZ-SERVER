const nodemailer = require("nodemailer");

exports.sendBannedEmail = async (displayName, userEmail) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "Tài khoản của bạn đã bị khóa",
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
          <p style="margin-bottom: 16px;">Xin chào ${displayName}, tài khoản của bạn đã bị khóa do vi phạm quy tắc của chúng tôi..</p>
          <div style="display: inline-block; text-align: center;">
            <div style="display: inline-block; border-radius: 9999px; background-color: #77CC00; color: white; padding: 8px 24px; margin-left: 8px;">
              Bạn sẽ được mở khóa tài khoản vào ngày đầu tiên của tháng
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
