const User = require("../models/User");
const Order = require("../models/Order");

const UserVoucher = require("../models/UserVoucher");
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
    const user = await User.findOne(filter).populate("userCart");
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

// const getAllUsersPaginate = async (page = 1, limit = 10, filters = {}) => {
//   try {
//     // Tính toán số lượng tài liệu cần bỏ qua
//     const skip = (page - 1) * limit;

//     // Tạo điều kiện tìm kiếm dựa trên filters
//     const query = {};
//     if (filters.userRole) {
//       query.userRole = filters.userRole;
//     }

//     if (filters.userEmail) {
//       query.userEmail = { $regex: filters.userEmail, $options: "i" }; // Tìm kiếm không phân biệt chữ hoa chữ thường
//     }

//     // Lấy danh sách người dùng với điều kiện và phân trang
//     const users = await User.find(query).skip(skip).limit(limit);

//     // Đếm tổng số lượng người dùng phù hợp với điều kiện
//     const totalUsers = await User.countDocuments(query);

//     return {
//       success: true,
//       data: users,
//       currentPage: page,
//       totalPages: Math.ceil(totalUsers / limit),
//     };
//   } catch (error) {
//     return { success: false, message: error.message };
//   }
// };

const getAllUsersPaginate = async (page = 1, limit = 10, filters = {}) => {
  try {
    const skip = (page - 1) * limit;

    const query = {};
    if (filters.userRole) {
      query.userRole = filters.userRole;
    }

    if (filters.userEmail) {
      query.userEmail = { $regex: filters.userEmail, $options: "i" };
    }

    const users = await User.find(query).skip(skip).limit(limit).lean();
    const totalUsers = await User.countDocuments(query);

    if (users.length === 0) {
      return {
        success: true,
        data: [],
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
      };
    }

    const userIds = users.map((u) => u._id);

    const currentMonth = new Date();
    currentMonth.setDate(1);
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const cancelledOrders = await Order.aggregate([
      {
        $match: {
          userId: { $in: userIds },
          orderStatus: "CANCELLED",
          createdAt: { $gte: currentMonth, $lt: nextMonth },
        },
      },
      {
        $group: {
          _id: "$userId",
          cancelCount: { $sum: 1 },
        },
      },
    ]);

    const cancelCountMap = {};
    cancelledOrders.forEach((item) => {
      cancelCountMap[item._id.toString()] = item.cancelCount;
    });

    const usersWithCancelCount = users.map((user) => ({
      ...user,
      cancelCount: cancelCountMap[user._id.toString()] || 0,
    }));

    await Promise.all(
      usersWithCancelCount.map(async (user) => {
        if (user.cancelCount > 5 && !user.bannedUser) {
          await User.findByIdAndUpdate(user._id, { bannedUser: true });
        }
      })
    );

    return {
      success: true,
      data: usersWithCancelCount,
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
    if (!userId) {
      throw new Error("User ID is required");
    }

    const currentPage = parseInt(page, 10);
    const itemsPerPage = parseInt(limit, 10);
    const skip = (currentPage - 1) * itemsPerPage;

    // Query bảng UserVoucher
    const query = { userId };

    if (typeFilter) {
      query["vouchers.voucherId.voucherType"] = new RegExp(typeFilter, "i");
    }

    if (voucherId && mongoose.Types.ObjectId.isValid(voucherId)) {
      query["vouchers.voucherId._id"] = voucherId;
    }

    const userVouchers = await UserVoucher.find(query)
      .populate({
        path: "vouchers.voucherId",
      })
      .exec();

    // Lọc và xóa các voucher đã hết hạn
    const currentDate = new Date();
    const validVouchers = [];

    for (const userVoucher of userVouchers) {
      const filteredVouchers = userVoucher.vouchers.filter((voucher) => {
        return new Date(voucher.expirationDate) > currentDate;
      });

      // Nếu có voucher đã hết hạn, cập nhật lại document
      if (filteredVouchers.length !== userVoucher.vouchers.length) {
        userVoucher.vouchers = filteredVouchers;
        await userVoucher.save();
      }

      validVouchers.push(...filteredVouchers);
    }

    // Nếu cần sắp xếp theo salePercent
    const sortedVouchers = validVouchers.sort((a, b) => {
      if (salePercentSort === "asc") {
        return a.voucherId.salePercent - b.voucherId.salePercent;
      } else if (salePercentSort === "desc") {
        return b.voucherId.salePercent - a.voucherId.salePercent;
      } else {
        return 0;
      }
    });

    // Tổng số voucher
    const totalItems = sortedVouchers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Phân trang
    const paginatedVouchers = sortedVouchers.slice(skip, skip + itemsPerPage);

    return {
      vouchers: paginatedVouchers,
      currentPage,
      totalPages,
    };
  } catch (error) {
    console.log("Error in getVoucherHeld - services:", error);
    throw new Error("Failed to fetch vouchers");
  }
};

const decreaseUserVoucher = async (userId, voucherId) => {
  try {
    const userVouchers = await UserVoucher.findOne({ userId });
    if (!userVouchers) {
      throw new Error("User vouchers not found");
    }

    // Tìm voucher trong danh sách
    const voucherIndex = userVouchers.vouchers.findIndex(
      (voucher) => voucher.voucherId.toString() === voucherId
    );

    if (voucherIndex === -1) {
      throw new Error("Voucher not found for the user");
    }

    const voucherItem = userVouchers.vouchers[voucherIndex];

    // Giảm số lượng hoặc xóa voucher
    if (voucherItem.quantity > 1) {
      voucherItem.quantity -= 1;
    } else {
      userVouchers.vouchers.splice(voucherIndex, 1);
    }

    // Lưu lại thay đổi
    await userVouchers.save();
    console.log("Voucher quantity updated successfully");
    return { success: true, message: "Voucher quantity updated" };
  } catch (error) {
    console.error("Error in decreaseUserVoucher:", error.message);
    return { success: false, message: error.message };
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
