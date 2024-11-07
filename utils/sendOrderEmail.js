const nodemailer = require("nodemailer");

exports.sendBookingEmail = async (email, bookingDetail, products) => {
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
       <div style="display: "flex"; alignItems: "center"; gap: "8px"">
                <div>
                  ${product.productName}<p>${product.productOption} x ${
        product.productQuantity
      }</p>
                </div>
                <img
style="border-radius: 15px;"                  width="50"
                  src=${product.productImage}
                  alt=""
                />
              </div>
           
              <div>
                ${product.productOption}  Số lượng: ${product.productQuantity}
              </div>
          </td>
          <td style="padding: 0.5rem 0; color: #4a4a4a; text-align: right;">
            ${(product.productPrice * product.productQuantity).toLocaleString(
              "it-IT",
              {
                style: "currency",
                currency: "VND",
              }
            )}
          </td>
        </tr>
      `
    )
    .join("");

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Chi tiết đơn hàng của bạn",
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
          <p style="margin: 0;">Bạn đã đặt hàng thành công</p>
          <p style="margin: 0;">
            Chúng tôi sẽ liên hệ để xác nhận đơn hàng của bạn sớm nhất
          </p>
        </div>
        <div style="margin-top: 1rem;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="text-align: left; font-size: 0.75rem; font-weight: bold; color: #000000;">Sản phẩm</th>
                <th style="text-align: right; font-size: 0.75rem; font-weight: bold; color: #000000;">Giá tiền</th>
              </tr>
            </thead>
            <tbody>
              ${productList}
            </tbody>
          </table>
          <table style="width:100%; border-collapse: collapse; margin-top: 1rem;">
            <tr>
              <th style="font-weight: bold; color: #4a4a4a; text-align: left;">Tổng tiền:</th>
              <th style="font-weight: bold; color: #4a4a4a; text-align: right;">
                ${bookingDetail.totalAfterDiscount.toLocaleString("it-IT", {
                  style: "currency",
                  currency: "VND",
                })}
              </th>
            </tr>
          </table>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
