const Cart = require("../models/Cart");
const User = require("../models/User");
const userServices = require("../services/userServices");

// Get user by ID
const getUserById = async (req, res) => {
  const userId = req.params.id;
  const result = await userServices.getUser({ _id: userId });

  if (result.success) {
    res.status(200).json(result.data);
  } else {
    res.status(404).json({ message: result.message });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  const result = await userServices.getAllUsers();

  if (result.success) {
    res.status(200).json(result.data);
  } else {
    res.status(500).json({ message: result.message });
  }
};

const getAllUsersPaginate = async (req, res) => {
  const { page = 1, limit = 10, userRole, username, userEmail } = req.query;

  // Tạo filters từ các tham số truy vấn
  const filters = { userRole, username, userEmail };

  const result = await userServices.getAllUsersPaginate(
    Number(page),
    Number(limit),
    filters
  );

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json({ message: result.message });
  }
};

// Update user by ID
const updateUserById = async (req, res) => {
  const { userId } = req.body;
  const updateData = req.body;

  const result = await userServices.updateUser(userId, updateData);

  if (result.success) {
    res.status(200).json(result.data);
  } else {
    res.status(404).json({ message: result.message });
  }
};

const getVoucherHeld = async (req, res) => {
  try {
    const { userId, page, salePercentSort, typeFilter, limit } = req.query;

    if (!userId) {
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (userId) {
      const result = await userServices.getVoucherHeld(
        userId,
        page,
        salePercentSort,
        typeFilter,
        limit
      );
      return res.status(200).json(result);
    }
  } catch (error) {
    console.log("Error in getVoucherHeld - controller:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const changeUserRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body;

    // Kiểm tra input
    if (!userId || !newRole) {
      return res
        .status(400)
        .json({ message: "userId và newRole là bắt buộc." });
    }

    // Gọi service để thay đổi role
    const updatedUser = await userServices.changeUserRole(userId, newRole);

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    res
      .status(200)
      .json({ message: "Cập nhật role thành công.", user: updatedUser });
  } catch (error) {
    console.error("Error in changeUserRole:", error);
    res.status(500).json({ message: "Có lỗi xảy ra khi cập nhật role." });
  }
};

const deleteAllByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const cart = await Cart.findOne({ _id: user.userCart });
    cart.cartItems = [];
    await cart.save();

    return res
      .status(200)
      .json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getUserById,
  getAllUsers,
  updateUserById,
  getVoucherHeld,
  deleteAllByUser,
  getAllUsersPaginate,
  changeUserRole,
};
