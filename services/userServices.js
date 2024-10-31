const User = require("../models/User");
const bcrypt = require("bcrypt");

/**
 * Function to get a user by a specific filter (like userId, googleId, etc.)
 * @param {Object} filter - The filter criteria (e.g., { userId }, { googleId })
 * @param {String} userId - ID user cần cập nhật
 * @param {Object} updateData
 * @returns {Object} - trả về đối tượng user hoặc null nếu ko thấy
 * @returns {Array} - trả về mảng users object
 */

// Get user
const getUser = async (filter) => {
  try {
    const user = await User.findOne(filter);
    if (!user) {
      return { success: false, message: "User not found" };
    }
    return { success: true, data: user };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Get All Users
const getAllUsers = async () => {
  try {
    const users = await User.find({}); // Fetch all users
    return { success: true, data: users };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const getAllUsersPaginate = async (page = 1, limit = 10, filters = {}) => {
  try {
    // Tính toán số lượng tài liệu cần bỏ qua
    const skip = (page - 1) * limit;

    // Tạo điều kiện tìm kiếm dựa trên filters
    const query = {};
    if (filters.userRole) {
      query.userRole = filters.userRole;
    }
    if (filters.username) {
      query.username = { $regex: filters.username, $options: "i" }; // Tìm kiếm không phân biệt chữ hoa chữ thường
    }
    if (filters.userEmail) {
      query.userEmail = { $regex: filters.userEmail, $options: "i" }; // Tìm kiếm không phân biệt chữ hoa chữ thường
    }

    // Lấy danh sách người dùng với điều kiện và phân trang
    const users = await User.find(query).skip(skip).limit(limit);

    // Đếm tổng số lượng người dùng phù hợp với điều kiện
    const totalUsers = await User.countDocuments(query);

    return {
      success: true,
      data: users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Update User Information
const updateUser = async (userId, updateData) => {
  try {
    let {
      newPassword,
      displayName,
      birthDay,
      userPhone,
      userImage,
      userAddress,
    } = updateData;

    // Check if the password is being updated
    if (newPassword) {
      // Generate a salt and hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      newPassword = hashedPassword; // Replace the plain text password with the hashed one
    }

    // Assuming User is a Mongoose model
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        password: newPassword,
        displayName: displayName,
        birthDay: birthDay,
        userPhone: userPhone,
        userImage: userImage,
        userAddress: userAddress,
      }, // Set new values
      { new: true, runValidators: true } // Return the updated document and apply validators
    );

    if (!updatedUser) {
      return { success: false, message: "User not found" };
    }

    return { success: true, data: updatedUser };
  } catch (error) {
    console.log(error);
    return { success: false, message: error.message };
  }
};

const getVoucherHeld = async (
  userId,
  page = 1,
  salePercentSort,
  typeFilter,
  limit = 8,
  voucherId
) => {
  try {
    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);

    const skip = (currentPage - 1) * itemsPerPage;

    const user = await User.findById(userId).select("userVoucher").populate({
      path: "userVoucher.voucherId",
      model: "Voucher",
    });

    if (!user) {
      throw new Error("User not found");
    }

    const query = {};
    if (typeFilter) {
      query.voucherType = new RegExp(typeFilter, "i");
    }

    if (voucherId) {
      query._id = voucherId;
    }

    const userVouchers = user.userVoucher.filter((voucher) => {
      let isValid = true;
      if (
        query.voucherType &&
        !query.voucherType.test(voucher.voucherId.voucherType)
      ) {
        isValid = false;
      }
      if (
        query._id &&
        voucher.voucherId._id.toString() !== query._id.toString()
      ) {
        isValid = false;
      }
      return isValid;
    });

    const sortedVouchers = userVouchers.sort((a, b) => {
      if (salePercentSort === "asc") {
        return a.voucherId.salePercent - b.voucherId.salePercent;
      } else if (salePercentSort === "desc") {
        return b.voucherId.salePercent - a.voucherId.salePercent;
      } else {
        return 0;
      }
    });

    const totalItems = sortedVouchers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const paginatedVouchers = sortedVouchers.slice(skip, skip + itemsPerPage);

    return {
      vouchers: paginatedVouchers,
      currentPage,
      totalPages,
    };
  } catch (error) {
    console.log("Error in getVoucherHeldWithQuery - services", error);
    throw new Error("Failed to fetch vouchers");
  }
};

const decreaseUserVoucher = async (userId, voucherId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const voucherIndex = user.userVoucher.findIndex(
      (voucher) => voucher.voucherId.toString() === voucherId
    );

    if (voucherIndex === -1) {
      throw new Error("Voucher not found in user's vouchers");
    }

    const voucherItem = user.userVoucher[voucherIndex];

    if (voucherItem.quantity > 1) {
      voucherItem.quantity -= 1;
    } else {
      user.userVoucher.splice(voucherIndex, 1);
    }

    await user.save();
    console.log("Voucher quantity updated successfully");
  } catch (error) {
    console.error("Error in decreaseUserVoucher:", error.message);
    throw error;
  }
};

const changeUserRole = async (userId, newRole) => {
  try {
    // Kiểm tra nếu role mới không nằm trong danh sách role hợp lệ
    const validRoles = ["admin", "user", "spa", "manager", "seller"];
    if (!validRoles.includes(newRole)) {
      throw new Error("Role không hợp lệ.");
    }

    // Tìm user và cập nhật role
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { userRole: newRole },
      { new: true, runValidators: true }
    );

    return updatedUser;
  } catch (error) {
    console.error("Error in userService // changeUserRole:", error);
    throw error;
  }
};

module.exports = {
  getUser,
  getAllUsers,
  updateUser,
  getVoucherHeld,
  decreaseUserVoucher,
  getAllUsersPaginate,
  changeUserRole,
};
