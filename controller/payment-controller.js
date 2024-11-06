const crypto = require("crypto");
const Order = require("../models/Order");
const User = require("../models/User");
const UserServices = require("../services/userServices");

exports.paymentCallback = async (req, res) => {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = req.body;

    // Lấy secretKey từ biến môi trường hoặc giá trị mặc định
    const secretKey =
      process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";

    // Tạo rawSignature để xác thực callback từ MoMo
    const rawSignature = `accessKey=${
      process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85"
    }&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    // Tạo signature từ rawSignature và secretKey
    const generatedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ error: "Chữ ký không hợp lệ." });
    }

    if (resultCode === 0) {
      const order = await Order.findOne({ _id: orderId });

      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      order.orderStatus = "PAID";
      await order.save();

      if (order.userId) {
        const user = await User.findById(order.userId);

        if (user) {
          const pointsToAdd = parseInt(amount) / 100;
          user.userPoint += pointsToAdd;
          await user.save();
        }
      }

      return res.status(200).json({ message: "Thanh toán thành công." });
    }
    if (resultCode !== 0) {
      order.orderStatus = "FAILED";
      await order.save();

      return res.status(400).json({ error: "Thanh toán thất bại." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
