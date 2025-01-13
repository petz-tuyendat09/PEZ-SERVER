const axios = require("axios");
const crypto = require("crypto");

async function momoPaymentBooking(amount, orderId) {
  if (!amount || !orderId) {
    return res.status(400).json({ error: "Amount and orderId are required." });
  }

  const partnerCode = process.env.MOMO_PARTNER_CODE || "MOMO";
  const accessKey = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
  const secretKey =
    process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";

  if (!partnerCode || !accessKey || !secretKey) {
    return "Missing required environment variables.";
  }

  const orderInfo = "Thanh toán đơn hàng";
  const redirectUrl =
    process.env.DOMAIN_URL || "http://localhost:3000/booking-success";
  const ipnUrl =
    "https://32e4-2405-4803-d74e-7e00-8df8-7cef-8593-b8d7.ngrok-free.app/api/payment/callback-paymentBooking";
  const requestId = orderId;
  const requestType = "captureWallet";
  const extraData = "";

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const body = {
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    requestType,
    extraData,
    signature,
    lang: "vi",
  };

  const options = {
    method: "POST",
    url: "https://test-payment.momo.vn/v2/gateway/api/create",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
  };

  try {
    const response = await axios(options);
    return response.data;
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    return {
      error: "Payment processing failed.",
      details: error.response ? error.response.data : error.message,
    };
  }
}

module.exports = momoPaymentBooking;
