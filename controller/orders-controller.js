const Order = require("../models/Order");
const Product = require("../models/Product");
const orderServices = require("../services/orderServices");
const User = require("../models/User");
const UserServices = require("../services/userServices");
const Cart = require("../models/Cart");
const { sendBookingEmail } = require("../utils/sendOrderEmail");
const { lowstockNofi } = require("../services/productServices");

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

exports.insertOrders = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      products,
      orderTotal,
      voucherId,
      orderDiscount,
      userId,
      totalAfterDiscount,
      paymentMethod,
      orderStatus,
    } = req.body;

    if (userId == null) {
      throw new Error("Bạn cần đăng nhập để thực hiện hành động này.");
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new Error("Không tìm thấy người dùng");
    }

    if (user.bannedUser === true) {
      return res.status(502).json({
        message: "Tài khoản của bạn đã bị khóa, không thể thực hiện.",
      });
    }

    const today = new Date();
    const startOfDay = new Date(today.toISOString().split("T")[0]); // 00:00:00 UTC
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(startOfDay.getUTCDate() + 1); // 00:00:00 ngày mai UTC

    const ordersToday = await Order.countDocuments({
      userId: userId,
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    const maxOrdersPerDay = 5;
    if (ordersToday >= maxOrdersPerDay) {
      throw new Error("Bạn đã đạt tối đa đơn hàng có thể đặt trong ngày.");
    }

    const OrderModel = new Order({
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      products,
      orderTotal,
      voucherId,
      orderDiscount,
      userId,
      totalAfterDiscount,
      paymentMethod,
      orderStatus,
    });

    const savedOrder = await OrderModel.save();

    const productUpdates = products.map(async (item) => {
      const product = await Product.findOne({
        _id: item.productId,
        "productOption.name": item.productOption,
      });
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const option = product.productOption.find(
        (option) => option.name === item.productOption
      );
      if (!option || option.productQuantity < item.productQuantity) {
        throw new Error(`Sản phẩm ${item.productName} đã hết hàng`);
      }

      option.productQuantity -= item.productQuantity;

      // Kiểm tra tổng số lượng sản phẩm sau khi cập nhật
      const totalQuantity = product.productOption.reduce(
        (sum, option) => sum + option.productQuantity,
        0
      );

      if (totalQuantity < 20) {
        lowstockNofi({ productId: product._id });
      }

      await product.save();
    });

    await Promise.all(productUpdates);

    if (userId) {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            userOrders: {
              orderDate: new Date(),
              orderId: savedOrder._id,
              orderTotal: totalAfterDiscount,
            },
          },
        },
        { new: true }
      );

      if (voucherId) {
        await UserServices.decreaseUserVoucher(user._id, savedOrder.voucherId);
      }
      await Cart.findByIdAndUpdate(user.userCart, { cartItems: [] });
    }
    sendBookingEmail(customerEmail, savedOrder, products);

    return res.status(200).json({
      success: true,
      orderId: savedOrder._id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.queryOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      year,
      month,
      day,
      userId,
      customerName,
      totalPriceSort,
      productQuantitySort,
      orderStatus,
    } = req.query;

    const orders = await orderServices.queryOrders({
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
    });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId, userId } = req.body;

    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "Order ID is required" });
    }

    const result = await orderServices.cancelOrder(orderId, userId);

    if (!result.success) {
      return res.status(404).json({ success: false, message: result.message });
    }

    return res
      .status(200)
      .json({ success: true, message: "Hủy đơn thành công" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.editOrderStatus = async (req, res) => {
  try {
    const { orderId, newStatus } = req.body;
    if (!orderId || !newStatus) {
      return res.status(400).json({
        success: false,
        message: "Order ID and new status are required.",
      });
    }

    const updatedOrder = await orderServices.updateOrderStatus(
      orderId,
      newStatus
    );
    if (!updatedOrder) {
      return res.status(400).json({
        success: false,
        message: "Không thể đổi sang trạng thái trước đó.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Error in editOrderStatus: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};
