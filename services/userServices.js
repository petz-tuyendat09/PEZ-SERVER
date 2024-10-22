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

// Update User Information
const updateUser = async (userId, updateData) => {
  try {
    let { newPassword, displayName, userPhone, userImage, userAddress } =
      updateData;

    console.log(newPassword);
    // Check if the password is being updated
    if (newPassword) {
      // Generate a salt and hash the password
      console.log(newPassword);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      console.log(hashedPassword);
      newPassword = hashedPassword; // Replace the plain text password with the hashed one
    }

    // Assuming User is a Mongoose model
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        password: newPassword,
        displayName: displayName,
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
    // Chuyển đổi giá trị sort thành 1 (asc) hoặc -1 (desc)

    // Chuyển đổi page và limit sang số nguyên
    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);

    // Tính offset cho phân trang
    const skip = (currentPage - 1) * itemsPerPage;

    // Lấy danh sách voucher của user
    const user = await User.findById(userId)
      .select("userVoucher") // Only select userVoucher field
      .populate({
        path: "userVoucher.voucherId",
        model: "Voucher", // Reference the Voucher model
      });

    if (!user) {
      throw new Error("User not found");
    }

    // Tạo điều kiện lọc dựa trên typeFilter và voucherId
    const query = {};
    if (typeFilter) {
      query.voucherType = new RegExp(typeFilter, "i"); // Lọc theo voucherType
    }
    console.log(query);

    if (voucherId) {
      query._id = voucherId; // Lọc theo voucherId nếu có
    }

    // Lọc các voucher mà user đang giữ
    const userVouchers = user.userVoucher.filter((voucher) => {
      // Kiểm tra các điều kiện của query (voucherType và voucherId)
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

    // Sắp xếp danh sách voucher theo salePercent và voucherPoint
    const sortedVouchers = userVouchers.sort((a, b) => {
      // So sánh theo salePercent, dựa trên giá trị của salePercentSort
      if (salePercentSort === "asc") {
        return a.voucherId.salePercent - b.voucherId.salePercent;
      } else if (salePercentSort === "desc") {
        return b.voucherId.salePercent - a.voucherId.salePercent;
      } else {
        return 0; // Không sắp xếp nếu salePercentSort không xác định
      }
    });

    // Tính tổng số voucher và tổng số trang
    const totalItems = sortedVouchers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Lấy danh sách voucher với phân trang
    const paginatedVouchers = sortedVouchers.slice(skip, skip + itemsPerPage);

    // Trả về kết quả bao gồm thông tin phân trang
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

module.exports = {
  getUser,
  getAllUsers,
  updateUser,
  getVoucherHeld,
};
