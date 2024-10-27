const Order = require("../models/Order");
const orderServices = require("../services/orderServices");

exports.getOrderByUserId = async (req, res) => {
  try {
    const { userId } = req.query;
    if (userId) {
      const orders = await orderServices.getOrderByUserId(userId);
      return res.status(200).json(orders);
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getOrderByOrderId = async (req, res) => {
  try {
    const { orderId } = req.query;
    console.log(orderId);
    const orders = await orderServices.getOrderByOrderId(orderId);
    return res.status(200).json(orders);
  } catch (error) {
    console.log(error);
  }
};
