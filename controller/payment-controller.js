const crypto = require("crypto");
const Order = require("../models/Order");
const User = require("../models/User");
const Booking = require("../models/Booking");

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

    // Xử lý khi thanh toán thành công
    if (resultCode === 0) {
      const order = await Order.findOne({ _id: orderId });

      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      // Cập nhật trạng thái và lưu transIDMomo
      order.orderStatus = "PAID";
      order.transIDMomo = transId; // Lưu transId từ MoMo vào Order
      await order.save();

      // Cộng điểm cho người dùng nếu có userId
      if (order.userId) {
        const user = await User.findById(order.userId);

        if (user) {
          const pointsToAdd = parseInt(amount) / 100; // Quy đổi điểm
          user.userPoint += pointsToAdd;
          await user.save();
        }
      }

      return res.status(200).json({ message: "Thanh toán thành công." });
    }

    // Xử lý khi thanh toán thất bại
    if (resultCode !== 0) {
      const order = await Order.findOne({ _id: orderId });

      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      order.orderStatus = "FAILED";
      await order.save();

      return res.status(400).json({ error: "Thanh toán thất bại." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

exports.paymentCallbackBooking = async (req, res) => {
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

    console.log(req.body);

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

    // Xử lý khi thanh toán thành công
    if (resultCode === 0) {
      const booking = await Booking.findOne({ _id: orderId });

      if (!booking) {
        return res.status(404).json({ error: "Order not found." });
      }

      // Cập nhật trạng thái và lưu transIDMomo
      booking.bookingStatus = "Paid";
      booking.transIDMomo = transId; // Lưu transId từ MoMo vào Order
      await booking.save();

      // Cộng điểm cho người dùng nếu có userId
      if (booking.userId) {
        const user = await User.findById(booking.userId);

        if (user) {
          const pointsToAdd = parseInt(amount) / 100; // Quy đổi điểm
          user.userPoint += pointsToAdd;
          await user.save();
        }
      }

      return res.status(200).json({ message: "Thanh toán thành công." });
    }

    // Xử lý khi thanh toán thất bại
    if (resultCode !== 0) {
      const order = await Order.findOne({ _id: orderId });

      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      order.orderStatus = "FAILED";
      await order.save();

      return res.status(400).json({ error: "Thanh toán thất bại." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
