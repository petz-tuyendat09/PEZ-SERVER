const axios = require("axios");
const crypto = require("crypto");

async function handler(req, res) {
  const { amount, orderId } = req.body;

  if (!amount || !orderId) {
    return res.status(400).json({ error: "Amount and orderId are required." });
  }

  const partnerCode = process.env.MOMO_PARTNER_CODE || "MOMO";
  const accessKey = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
  const secretKey =
    process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";

  if (!partnerCode || !accessKey || !secretKey) {
    return res
      .status(500)
      .json({ error: "Missing required environment variables." });
  }

  const orderInfo = "Thanh toán đơn hàng";
  const redirectUrl =
    process.env.DOMAIN_URL ||
    "https://petz-zeta.vercel.app/cart/place-order/payment-status";
  const ipnUrl =
    "https://061a-2405-4803-c848-94f0-91aa-f8cf-8368-305a.ngrok-free.app/api/payment/callback-payment";
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
    return res.status(200).json(response.data);
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    return res.status(500).json({
      error: "Payment processing failed.",
      details: error.response ? error.response.data : error.message,
    });
  }
}

module.exports = handler;
