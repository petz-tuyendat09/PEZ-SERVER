const axios = require('axios');

async function handler(req, res) {
    const { amount, orderId } = req.body;
    const partnerCode = 'MOMO';
    const accessKey = 'F8BBA842ECF85';
    const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    const orderInfo = 'Thanh toán đơn hàng';
    const redirectUrl = 'http://localhost:3000/redirect';
    const ipnUrl = 'http://localhost:3000/api/ipn';
    const requestId = orderId;
    const requestType = 'captureMoMoWallet';

    const rawHash = `partnerCode=${partnerCode}&accessKey=${accessKey}&requestId=${requestId}&amount=${amount}&orderId=${orderId}&orderInfo=${orderInfo}&returnUrl=${redirectUrl}&notifyUrl=${ipnUrl}&requestType=${requestType}`;
    const crypto = require('crypto');
    const signature = crypto.createHmac('sha256', secretKey).update(rawHash).digest('hex');

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
        signature,
    };

    try {
        const response = await axios.post('https://test-payment.momo.vn/gw_payment/transactionProcessor', body);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
module.exports = handler;
