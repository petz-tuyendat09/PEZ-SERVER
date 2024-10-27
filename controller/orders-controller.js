const Order = require("../models/Order");
const orderServices = require("../services/orderServices");

exports.getOrderByUserId = async (req, res) => {
  try {
    const { userId } = req.query;
    const orders = await orderServices.getOrderByUserId(userId);
    return res.status(200).json(orders);
  } catch (error) {
    console.log(error);
  }
};

exports.insertOrders = async (req, res) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      customerEmail, 
      customerAddress, 
      productId,
      orderTotal, 
      voucherId,
      orderDiscount, 
      userId, 
      totalAfterDiscount, 
      paymentMethod, 
      orderStatus
    } = req.body
    const OrderModel = new Order({
      customerName, 
      customerPhone, 
      customerEmail, 
      customerAddress, 
      productId,
      orderTotal, 
      voucherId,
      orderDiscount, 
      userId, 
      totalAfterDiscount, 
      paymentMethod, 
      orderStatus
    })
    const savedOrder = await OrderModel.save();
    return res.status(200).json({ success: true, data: savedOrder })
  } catch (error) {
    console.log(error);
  }
}
