const Order = require("../models/Order");
const User = require("../models/User");
const ReviewProducts = require("../models/ReviewProducts");
const Product = require("../models/Product");
const { sendDeliveringEmail } = require("../utils/sendDeliveringEmail");
const { sendDeliveredEmail } = require("../utils/sendDeliveredEmail");
const { sendBannedEmail } = require("../utils/sendBannedEmail");

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
  orderStatus,
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

  if (orderStatus) {
    query.orderStatus = orderStatus;
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

  const orders = await Order.aggregate([
    {
      $addFields: {
        productCount: { $size: "$products" },
      },
    },
    { $match: query },
    { $sort: { _id: -1, ...sortOption } },
    { $skip: (parseInt(page) - 1) * parseInt(limit) },
    { $limit: parseInt(limit) },
  ]);

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

exports.cancelOrder = async (orderId, userId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, message: "Order not found" };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const canceledOrderCount = await Order.countDocuments({
      userId: userId,
      orderStatus: "CANCELLED",
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    if (order.orderStatus === "CANCELLED") {
      return { success: false, message: "Order is already cancelled" };
    }

    for (const product of order.products) {
      const productInDb = await Product.findById(product.productId);
      if (productInDb) {
        const productOption = productInDb.productOption.find(
          (option) => option.name === product.productOption
        );
        if (productOption) {
          productOption.productQuantity += product.productQuantity;
        }
      }
      await productInDb.save();
    }

    order.orderStatus = "CANCELLED";
    await order.save();

    if (canceledOrderCount >= 10) {
      const user = await User.findById(userId);
      user.bannedUser = true;

      await user.save();
      sendBannedEmail(user.displayName, user.userEmail);
      banned = true;

      return {
        success: false,
        message: "Tài khoản của bạn đã bị hạn chế, vì hủy đơn quá nhiều.",
      };
    }

    return { success: true, message: "Hủy đơn thành công" };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Error canceling order",
      error: error.message,
    };
  }
};

async function createReviewIfNotExists(productId, productName, userId) {
  const existingReview = await ReviewProducts.findOne({
    userId,
    productId,
  });

  if (existingReview) {
    console.log("Review đã tồn tại cho sản phẩm này, không cần tạo mới.");
    return null;
  }

  const newReview = new ReviewProducts({
    userId,
    productId,
    productName,
    rating: null,
  });

  await newReview.save();
  console.log("Review mới đã được tạo.");
  return newReview;
}

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

  if (newStatus === "DELIVERING") {
    sendDeliveringEmail(order);
  }

  if (newStatus === "DELIVERED" && order.userId) {
    const points = Math.floor(order.totalAfterDiscount / 100);
    await User.findByIdAndUpdate(order.userId, {
      $inc: { userPoint: points },
    });

    for (const product of order.products) {
      await createReviewIfNotExists(
        product.productId,
        product.productName,
        order.userId
      );
    }
    sendDeliveredEmail(order);
  }

  if (newStatus === "CANCELLED") {
    for (const product of order.products) {
      const productInDb = await Product.findById(product.productId);
      if (productInDb) {
        const productOption = productInDb.productOption.find(
          (option) => option.name === product.productOption
        );
        if (productOption) {
          productOption.productQuantity += product.productQuantity;
        }
      }
      await productInDb.save();
    }
  }

  // Update the order status
  order.orderStatus = newStatus;
  await order.save();
  return order;
};
