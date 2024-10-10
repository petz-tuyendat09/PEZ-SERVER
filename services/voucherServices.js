const Voucher = require("../models/Voucher");

exports.queryVoucher = async ({
  page = 1,
  salePercentSort = "asc", // Sắp xếp theo % giảm giá (discountPercent)
  pointSort = "asc", // Sắp xếp theo điểm (voucherPoint)
  typeFilter = "", // Chuỗi voucherType để lọc
  limit = 25,
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
      totalItems,
    };
  } catch (error) {
    console.log("Error in queryVoucher", error);
    throw error;
  }
};
