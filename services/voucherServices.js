const Voucher = require("../models/Voucher");

exports.queryVoucher = async ({
  voucherId,
  page = 1,
  salePercentSort = "asc", // Sắp xếp theo % giảm giá (discountPercent)
  pointSort = "asc", // Sắp xếp theo điểm (voucherPoint)
  typeFilter = "", // Chuỗi voucherType để lọc
  limit = 5,
}) => {
  try {
    // Chuyển đổi giá trị sort thành 1 (asc) hoặc -1 (desc)
    const salePercentSortValue = salePercentSort === "asc" ? 1 : -1;
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
        discountPercent: salePercentSortValue, // Sắp xếp theo % giảm giá
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

const checkExistingVoucher = async (voucherType, salePercent, voucherPoint) => {
  const existingVoucher = await Voucher.findOne({
    $or: [{ salePercent }, { voucherPoint }],
  });

  if (existingVoucher) {
    if (existingVoucher.voucherType === voucherType) {
      return { exists: true, duplicateType: true };
    } else {
      return { exists: true, duplicateType: false };
    }
  }

  return { exists: false };
};

// Function to insert a voucher
exports.insertVoucher = async (
  voucherType,
  salePercent,
  voucherPoint,
  voucherDescription
) => {
  try {
    // Check if the voucher exists
    const checkResult = await checkExistingVoucher(
      voucherType,
      salePercent,
      voucherPoint
    );

    if (checkResult.exists) {
      if (checkResult.duplicateType) {
        return {
          success: false,
          message: "Voucher đã tồn tại",
        };
      } else {
        const newVoucher = new Voucher({
          voucherType,
          salePercent,
          voucherPoint,
          voucherDescription,
        });

        await newVoucher.save();
        return { success: true, message: "Thêm voucher thành công" };
      }
    }

    const newVoucher = new Voucher({
      voucherType,
      salePercent,
      voucherPoint,
      voucherDescription,
    });

    await newVoucher.save();
    return { success: true, message: "Thêm voucher thành công" };
  } catch (error) {
    console.log("Error in voucherService:", error);
    throw new Error("Error inserting voucher");
  }
};

exports.deleteVoucher = async (deleteVoucherId) => {
  try {
    const deletedVoucher = await Voucher.findByIdAndDelete(deleteVoucherId);

    return deletedVoucher;
  } catch (error) {
    throw new Error("Error deleting voucher.");
  }
};

exports.deleteMultipleVoucher = async (ids) => {
  try {
    const deletedVoucher = await Voucher.deleteMany({
      _id: { $in: ids },
    });
    return deletedVoucher;
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw new Error(err);
  }
};

exports.editVoucher = async (
  editVoucherId,
  newVoucherType,
  newVoucherSalePercent,
  newVoucherPoint,
  newVoucherDescription
) => {
  try {
    // Tìm và cập nhật voucher theo ID
    const updatedVoucher = await Voucher.findByIdAndUpdate(
      editVoucherId,
      {
        voucherType: newVoucherType,
        salePercent: newVoucherSalePercent,
        voucherPoint: newVoucherPoint,
        voucherDescription: newVoucherDescription,
      },
      { new: true } // Trả về document đã được cập nhật
    );

    return updatedVoucher;
  } catch (error) {
    throw new Error("Error updating voucher.");
  }
};
