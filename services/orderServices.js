const Order = require("../models/Order");

exports.getOrderByUserId = async (userId) => {
  try {
    // Find orders by userId
    const orders = await Order.find({ userId })
      .populate({
        path: "productId.productId",
        model: "Products",
      })
      .populate({
        path: "userId",
        model: "User",
        select: "username userEmail userPhone",
      })
      .sort({ createdAt: -1 });

    if (!orders.length) {
      throw new Error("No orders found for this user");
    }

    return orders;
  } catch (error) {
    console.log("Error in getOrderByUserId - services:", error);
    throw new Error("Failed to fetch orders");
  }
};
