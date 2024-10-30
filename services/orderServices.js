const Order = require("../models/Order");

exports.queryOrders = async ({
  page,
  limit,
  year,
  month,
  day,
  userId,
  customerName,
  totalPriceSort,
  productQuantitySort,
}) => {
  const query = {};

  // Date filtering
  if (year && month && day) {
    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);
    query.createdAt = { $gte: startDate, $lte: endDate };
  }

  if (userId === "yes") {
    query.userId = { $ne: null }; // Fetch orders where userId is not null
  } else if (userId === "no") {
    query.userId = null; // Fetch orders where userId is null
  }

  // Filter by customer name if provided
  if (customerName) {
    query.customerName = { $regex: new RegExp(customerName, "i") };
  }

  // Sorting options based on separate parameters
  let sortOption = {};
  if (totalPriceSort) {
    sortOption.totalAfterDiscount = totalPriceSort === "asc" ? 1 : -1;
  }

  // Sorting based on the length of productId array
  if (productQuantitySort) {
    sortOption.productCount = productQuantitySort === "asc" ? 1 : -1;
  }

  // Pagination and execution of query with a pipeline to calculate productCount
  const orders = await Order.aggregate([
    {
      $addFields: {
        productCount: { $size: "$products" },
      },
    },
    { $match: query },
    { $sort: sortOption },
    { $skip: (parseInt(page) - 1) * parseInt(limit) },
    { $limit: parseInt(limit) },
  ]);

  // Count total documents matching the query without pagination
  const totalDocuments = await Order.countDocuments(query);

  return {
    orders: orders,
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalDocuments / parseInt(limit)),
  };
};

exports.getOrderByUserId = async (userId) => {
  try {
    if (userId) {
      const orders = await Order.find({ userId })
        .populate({
          path: "products.productId",
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
    }
  } catch (error) {
    console.log("Error in getOrderByUserId - services:", error);
    throw new Error("Failed to fetch orders");
  }
};

exports.getOrderByOrderId = async (orderId) => {
  try {
    const orders = await Order.find({ _id: orderId })
      .populate({
        path: "products.productId",
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

exports.cancelOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    console.log(order);
    if (!order) {
      return { success: false, message: "Order not found" };
    }

    order.orderStatus = "CANCELLED";
    await order.save();

    return { success: true, message: "Order canceled successfully" };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Error canceling order",
      error: error.message,
    };
  }
};

exports.updateOrderStatus = async (orderId, newStatus) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  const currentStatus = order.orderStatus;

  if (
    (currentStatus === "PENDING" && newStatus === "PENDING") ||
    (currentStatus === "DELIVERING" && newStatus === "PENDING") ||
    (currentStatus === "DELIVERING" && newStatus === "DELIVERING") ||
    (currentStatus === "DELIVERED" && newStatus !== "DELIVERED") ||
    (currentStatus === "CANCELLED" && newStatus !== "CANCELLED")
  ) {
    return null; // Invalid transition
  }

  // Update the order status
  order.orderStatus = newStatus;
  await order.save();
  return order;
};
