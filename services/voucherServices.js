const Voucher = require("../models/Voucher");
const UserVoucher = require("../models/UserVoucher");
const User = require("../models/User");
const BATCH_SIZE = 50;

exports.queryVoucher = async ({
  voucherId,
  page = 1,
  pointSort, // Sắp xếp theo điểm (voucherPoint)
  typeFilter = "", // Chuỗi voucherType để lọc
  limit = 5,
  isHidden,
}) => {
  try {
    // Chuyển đổi giá trị sort thành 1 (asc) hoặc -1 (desc)
    const pointSortValue = pointSort === "asc" ? 1 : -1;

    // Chuyển đổi page và limit sang số nguyên
    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);

    // Tính offset cho phân trang
    const skip = (currentPage - 1) * itemsPerPage;

    // Tạo điều kiện lọc dựa trên typeFilter
    const query = {};
    if (typeFilter) {
      query.voucherType = new RegExp(typeFilter, "i"); // Tìm kiếm voucherType có chứa chuỗi typeFilter (không phân biệt hoa thường)
    }

    if (isHidden) {
      query.isHidden = isHidden;
    }

    if (voucherId) {
      query._id = voucherId;
    }

    // Lấy tổng số bản ghi dựa trên bộ lọc
    const totalItems = await Voucher.countDocuments(query);

    // Tính tổng số trang
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Lấy danh sách voucher với phân trang và sắp xếp
    const vouchers = await Voucher.find(query)
      .sort({
        voucherPoint: pointSortValue, // Sắp xếp theo điểm (voucherPoint)
      })
      .skip(skip) // Bỏ qua các bản ghi cho phân trang
      .limit(itemsPerPage); // Giới hạn số lượng bản ghi trả về

    // Trả về kết quả bao gồm thông tin phân trang
    return {
      vouchers,
      currentPage,
      totalPages,
    };
  } catch (error) {
    console.log("Error in queryVoucher", error);
    throw error;
  }
};

const checkExistingVoucher = async (
  voucherType,
  salePercent,
  voucherPoint,
  flatDiscountAmount,
  shippingDiscountAmount
) => {
  const existingVoucher = await Voucher.findOne({
    $or: [
      { salePercent: { $exists: true, $eq: salePercent } },
      { voucherPoint: { $exists: true, $eq: voucherPoint } },
      { flatDiscountAmount: { $exists: true, $eq: flatDiscountAmount } },
      {
        shippingDiscountAmount: { $exists: true, $eq: shippingDiscountAmount },
      },
    ],
  });

  if (existingVoucher) {
    const isSameType = existingVoucher.voucherType === voucherType;
    const isDuplicateDiscount =
      (existingVoucher.salePercent &&
        existingVoucher.salePercent === salePercent) ||
      (existingVoucher.flatDiscountAmount &&
        existingVoucher.flatDiscountAmount === flatDiscountAmount) ||
      (existingVoucher.shippingDiscountAmount &&
        existingVoucher.shippingDiscountAmount === shippingDiscountAmount);

    return {
      exists: true,
      duplicateType: isSameType,
      duplicateDiscount: isDuplicateDiscount,
    };
  }

  return { exists: false };
};

const parseLimitedDate = (limitedDate) => {
  if (limitedDate && limitedDate.day && limitedDate.year && limitedDate.month) {
    return new Date(limitedDate.year, limitedDate.month - 1, limitedDate.day);
  }
  return null;
};

exports.insertVoucher = async ({
  limitedDate,
  voucherQuantity,
  voucherType,
  voucherPoint,
  expirationDate,
  maxRedemption,
  voucherDescription,
  flatDiscountAmount,
  salePercent,
  shippingDiscountAmount,
  totalToUse,
}) => {
  try {
    // Kiểm tra voucher đã tồn tại hay chưa
    // const checkResult = await checkExistingVoucher(
    //   voucherType,
    //   salePercent,
    //   voucherPoint,
    //   flatDiscountAmount,
    //   shippingDiscountAmount
    // );

    const checkResult = true;

    if (checkResult) {
      if (checkResult.duplicateType) {
        return {
          success: false,
          message: "Voucher đã tồn tại",
        };
      } else {
        return { success: false, message: "Không thể thêm voucher trùng lặp" };
      }
    }

    // Chuẩn bị dữ liệu voucher
    const voucherData = {
      voucherType,
      voucherPoint,
      voucherDescription,
      limitedDate: parseLimitedDate(limitedDate), // Chuyển limitedDate thành Date
    };

    if (expirationDate !== null && expirationDate !== undefined) {
      voucherData.expirationDate = expirationDate;
    }
    if (totalToUse !== null && totalToUse !== undefined) {
      voucherData.totalToUse = totalToUse;
    }
    if (maxRedemption !== null && maxRedemption !== undefined) {
      voucherData.maxRedemption = maxRedemption;
    }
    if (flatDiscountAmount !== null && flatDiscountAmount !== undefined) {
      voucherData.flatDiscountAmount = flatDiscountAmount;
    }
    if (salePercent !== null && salePercent !== undefined) {
      voucherData.salePercent = salePercent;
    }
    if (
      shippingDiscountAmount !== null &&
      shippingDiscountAmount !== undefined
    ) {
      voucherData.shippingDiscountAmount = shippingDiscountAmount;
    }
    if (voucherQuantity !== 0 && voucherQuantity !== undefined) {
      voucherData.voucherQuantity = voucherQuantity;
    }

    // Tạo mới và lưu voucher
    const newVoucher = new Voucher(voucherData);
    await newVoucher.save();

    return { success: true, message: "Thêm voucher thành công" };
  } catch (error) {
    console.error("Error in voucherService:", error);
    throw new Error("Error inserting voucher");
  }
};

exports.deleteVoucher = async (deleteVoucherId) => {
  try {
    const deletedVoucher = await Voucher.findByIdAndDelete(deleteVoucherId);

    if (!deletedVoucher) {
      throw new Error("Voucher not found.");
    }

    let hasMore = true;

    while (hasMore) {
      // Lấy danh sách các user liên quan
      const users = await UserVoucher.find({
        "vouchers.voucherId": deleteVoucherId,
      })
        .limit(BATCH_SIZE)
        .exec();

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      // Cập nhật từng batch
      const userIds = users.map((user) => user._id);

      await UserVoucher.updateMany(
        { _id: { $in: userIds } },
        {
          $pull: { vouchers: { voucherId: deleteVoucherId } },
        }
      );
    }

    return deletedVoucher;
  } catch (error) {
    console.error("Error occurred:", error.message);
    throw new Error("Error deleting voucher.");
  }
};

exports.deleteMultipleVoucher = async (ids) => {
  try {
    // Xóa các voucher khỏi bảng Voucher
    const deletedVouchers = await Voucher.deleteMany({
      _id: { $in: ids },
    });

    if (!deletedVouchers.deletedCount) {
      throw new Error("No vouchers found to delete.");
    }

    let hasMore = true;

    while (hasMore) {
      // Lấy danh sách các user liên quan chứa các voucher trong danh sách ids
      const users = await UserVoucher.find({
        "vouchers.voucherId": { $in: ids },
      })
        .limit(BATCH_SIZE)
        .exec();

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      // Lấy danh sách userId từ batch hiện tại
      const userIds = users.map((user) => user._id);

      // Xóa các voucher trong danh sách ids khỏi các user trong batch
      await UserVoucher.updateMany(
        { _id: { $in: userIds } },
        {
          $pull: { vouchers: { voucherId: { $in: ids } } },
        }
      );
    }

    return deletedVouchers;
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw new Error("Error deleting multiple vouchers.");
  }
};

exports.editVoucher = async (
  editVoucherId,
  newVoucherType,
  newVoucherSalePercent,
  newExpirationDate,
  newMaxRedemption,
  newTotalToUse,
  newVoucherPoint,
  newVoucherDescription,
  newFlatDiscountAmount,
  newShippingDiscountAmount,
  newVoucherQuantity,
  newLimitedDate
) => {
  try {
    const updateData = prepareUpdateData(
      newVoucherType,
      newVoucherSalePercent,
      newFlatDiscountAmount,
      newShippingDiscountAmount
    );
    console.log(newVoucherQuantity);

    updateData.dataToSet.voucherPoint = newVoucherPoint;
    updateData.dataToSet.expirationDate = newExpirationDate;
    updateData.dataToSet.voucherDescription = newVoucherDescription;

    if (newMaxRedemption !== "") {
      updateData.dataToSet.maxRedemption = newMaxRedemption;
    } else {
      updateData.dataToUnset.maxRedemption = "";
    }

    if (newTotalToUse !== "") {
      updateData.dataToSet.totalToUse = newTotalToUse;
    } else {
      updateData.dataToUnset.totalToUse = "";
    }

    if (newVoucherQuantity !== "") {
      updateData.dataToSet.voucherQuantity = newVoucherQuantity;
    } else {
      updateData.dataToUnset.voucherQuantity = "";
    }

    if (newLimitedDate && typeof newLimitedDate === "object") {
      const { day, month, year } = newLimitedDate;
      if (
        day !== 0 &&
        month !== 0 &&
        year !== 0 &&
        day !== null &&
        month !== null &&
        year !== null
      ) {
        updateData.dataToSet.limitedDate = new Date(
          Date.UTC(year, month - 1, day)
        );
      } else {
        updateData.dataToUnset.limitedDate = "";
      }
    } else if (newLimitedDate === null) {
      updateData.dataToUnset.limitedDate = "";
    }

    const updatedVoucher = await Voucher.findByIdAndUpdate(
      editVoucherId,
      {
        $set: updateData.dataToSet,
        $unset: updateData.dataToUnset,
      },
      { new: true }
    );

    if (!updatedVoucher) {
      throw new Error("Voucher not found.");
    }

    return {
      success: true,
      message: "Cập nhật voucher thành công.",
      voucher: updatedVoucher,
    };
  } catch (error) {
    console.error("Error updating voucher:", error.message || error);
    return {
      success: false,
      message: error.message || "Error updating voucher.",
    };
  }
};

function prepareUpdateData(
  voucherType,
  salePercent,
  flatDiscountAmount,
  shippingDiscountAmount
) {
  const dataToSet = {};
  const dataToUnset = {};

  switch (voucherType) {
    case "FLAT_DISCOUNT":
      validateField(
        flatDiscountAmount,
        "Flat discount amount is required for FLAT_DISCOUNT."
      );
      dataToSet.flatDiscountAmount = flatDiscountAmount;
      dataToUnset.salePercent = "";
      dataToUnset.shippingDiscountAmount = "";
      break;

    case "ON_ORDER_SAVINGS":
      validateField(
        salePercent,
        "Sale percent is required for ON_ORDER_SAVINGS."
      );
      dataToSet.salePercent = salePercent;
      dataToUnset.flatDiscountAmount = "";
      dataToUnset.shippingDiscountAmount = "";
      break;

    case "SHIPPING_DISCOUNT":
      validateField(
        shippingDiscountAmount,
        "Shipping discount amount is required for SHIPPING_DISCOUNT."
      );
      dataToSet.shippingDiscountAmount = shippingDiscountAmount;
      dataToUnset.flatDiscountAmount = "";
      dataToUnset.salePercent = "";
      break;

    default:
      throw new Error("Invalid voucher type.");
  }

  return { dataToSet, dataToUnset };
}

function validateField(value, errorMessage) {
  if (!value) {
    throw new Error(errorMessage);
  }
}

exports.getVoucherCanExchange = async (userPoint, page, limit) => {
  try {
    const skip = (page - 1) * limit;

    const vouchers = await Voucher.find({
      voucherPoint: { $lte: userPoint },
    })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalVouchers = await Voucher.countDocuments({
      voucherPoint: { $lte: userPoint },
    });

    return {
      totalVouchers,
      totalPages: Math.ceil(totalVouchers / limit),
      currentPage: page,
      vouchers,
    };
  } catch (error) {
    console.log("Error in getVoucherCanExchange - services ", error);
  }
};

exports.changeVoucher = async (voucherPoint, voucherId, userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: "Không tìm thấy User" };
    }

    if (user.userPoint < voucherPoint) {
      return {
        success: false,
        message: "Không đủ điểm để đổi",
      };
    }

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return {
        success: false,
        message: "Không tìm thấy voucher, vui lòng tải lại trang",
      };
    }

    console.log(voucher.voucherQuantity);

    // Kiểm tra số lượng voucher có khả dụng
    if (voucher.voucherQuantity === 0) {
      return {
        success: false,
        message: "Voucher đã hết, vui lòng thử lại sau",
      };
    }

    const userVoucher = await UserVoucher.findOne({ userId });

    if (userVoucher) {
      const existingVoucher = userVoucher.vouchers.find(
        (v) => v.voucherId.toString() === voucherId
      );

      if (existingVoucher) {
        if (existingVoucher.redemptionCount >= voucher.maxRedemption) {
          return {
            success: false,
            message: "Bạn đã đạt số lần đổi tối đa cho voucher này",
          };
        }

        if (existingVoucher.quantity >= 10) {
          return {
            success: false,
            message: "Bạn đã sở hữu số lượng tối đa cho voucher này",
          };
        }

        existingVoucher.quantity += 1;
        existingVoucher.redemptionCount += 1;
        existingVoucher.expirationDate = new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000 // Extend expiration date by 2 days
        );
      } else {
        userVoucher.vouchers.push({
          voucherId,
          quantity: 1,
          redemptionCount: 1,
          expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days expiration
        });
      }

      await userVoucher.save();
    } else {
      const newUserVoucher = new UserVoucher({
        userId,
        vouchers: [
          {
            voucherId,
            quantity: 1,
            redemptionCount: 1,
            expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          },
        ],
      });

      await newUserVoucher.save();
    }

    // Giảm số lượng voucher khả dụng
    if (voucher.voucherQuantity) {
      voucher.voucherQuantity -= 1;
    }
    await voucher.save();

    // Giảm điểm user
    user.userPoint -= voucherPoint;
    await user.save();

    return { success: true, message: "Đổi voucher thành công" };
  } catch (error) {
    console.log("Error in changeVoucher service: ", error);
    return { success: false, message: "Internal Server Error" };
  }
};

exports.toggleVoucher = async ({ voucherId, toggleOption }) => {
  try {
    console.log("Đã ẩn");
    await Voucher.findByIdAndUpdate(voucherId, { isHidden: toggleOption });
    return { success: true, message: "Cập nhật thành công" };
  } catch (error) {
    console.log(error.message);
    return { success: false, message: "Cập nhật thất bại" };
  }
};
