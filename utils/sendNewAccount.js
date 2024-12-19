const nodemailer = require("nodemailer");

exports.sendNewAccount = async (userEmail, username, password) => {
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
    subject: "Tài khoản của mới của bạn",
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
          <p style="margin-bottom: 16px;">Xin chào ${userEmail}, đây là tài khoản mới của bạn.</p>
          <p style="margin-bottom: 16px;">Tài khoản: ${username}</p>
          <p style="margin-bottom: 16px;">Mật khẩu: ${password}</p>
        </div>
      </div>
    </td>
  </tr>
</table>


    `,
  };

  await transporter.sendMail(mailOptions);
};
