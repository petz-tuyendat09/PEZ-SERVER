const axios = require("axios");
const crypto = require("crypto");
const Order = require("../models/Order");

async function refundHandler(req, res) {
  console.log(req.body);

  try {
    const { transId, amount, orderId } = req.body;

    const refundOrderId = `${orderId}_${Date.now()}`;

    if (!transId || !amount || !orderId) {
      return res
        .status(400)
        .json({ error: "transId, amount, and orderId are required." });
    }

    const partnerCode = "MOMO";
    const accessKey = "F8BBA842ECF85";
    const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";

    if (!partnerCode || !accessKey || !secretKey) {
      return res
        .status(500)
        .json({ error: "Missing required environment variables." });
    }

    const requestId = `REFUND_${Date.now()}`; // Tạo requestId duy nhất cho giao dịch refund
    const requestType = "refund";
    const description = "";

    console.log(orderId);

    // Tạo rawSignature

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&description=${description}&orderId=${refundOrderId}&partnerCode=${partnerCode}&requestId=${requestId}&transId=${transId}`;

    // Tạo chữ ký signature
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    // Tạo payload cho API
    const body = {
      partnerCode: "MOMO",
      orderId: refundOrderId,
      requestId: requestId,
      amount: amount,
      transId: transId,
      lang: "vi",
      description: "",
      signature: signature,
    };

    const options = {
      method: "POST",
      url: "https://test-payment.momo.vn/v2/gateway/api/refund",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      timeout: 30000,
    };

    try {
      // Gửi request đến MoMo
      const response = await axios(options);
      const responseData = response.data;
      if (responseData.resultCode === 0) {
        // Refund thành công, cập nhật trạng thái Order
        const updatedOrder = await Order.findByIdAndUpdate(
          orderId,
          { orderStatus: "CANCELLED" },
          { new: true }
        );

        if (!updatedOrder) {
          return res.status(404).json({ error: "Order not found." });
        }

        return res.status(200).json({
          message: "Refund successful and order status updated.",
          data: updatedOrder,
        });
      } else {
        return res.status(400).json({
          error: "Refund failed.",
          details: responseData.message,
        });
      }
    } catch (error) {
      console.error(error.response ? error.response.data : error.message);
      return res.status(500).json({
        error: "Refund processing failed.",
        details: error.response ? error.response.data : error.message,
      });
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports = refundHandler;
