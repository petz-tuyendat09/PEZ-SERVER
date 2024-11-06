const nodemailer = require("nodemailer");

exports.sendLowstockEmail = async (email, products) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const productList = products
    .map(
      (product) => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 0.5rem 0; color: #4a4a4a;">
              <div style="display: flex; gap: 20px; align-items: center; gap: 8px;">
                <div>
                  ${product.productName}  ${product.productOption.join(", ")}
                  <p>Số lượng: ${product.productQuantity}</p>
                </div>
                <img
                  style="border-radius: 15px;" width="30"
                  src="${product.productImage}"
                  alt="${product.productName}"
                />
              </div>
            </td>
            <td style="padding: 0.5rem 0; color: red; text-align: right;">
               Sắp hết hàng
            </td>
          </tr>
        `
    )
    .join("");

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Thông báo hàng sắp hết",
    html: `
        <div style="margin: 0 auto; width: 500px; padding-bottom: 2rem;">
          <p>Xin chào ${email}</p>
          <p>Sản phẩm sau đây hiện có số lượng thấp:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="text-align: left; font-size: 0.75rem; font-weight: bold; color: #000000;">Sản phẩm</th>
                <th style="text-align: right; font-size: 0.75rem; font-weight: bold; color: #000000;">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${productList}
            </tbody>
          </table>
        </div>
      `,
  };

  await transporter.sendMail(mailOptions);
  console.log(
    "Email thông báo hàng sắp hết đã được gửi thành công tới:",
    email
  );
};
