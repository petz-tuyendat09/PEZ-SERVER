const Order = require("../models/Order");

async function getOrderStatistics({ startDate, endDate }) {
  try {
    // Parse the date strings into components
    const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
    const [endYear, endMonth, endDay] = endDate.split("-").map(Number);

    // Create Date objects (months are zero-indexed)
    const startDateFormat = new Date(startYear, startMonth - 1, startDay);
    const endDateFormat = new Date(
      endYear,
      endMonth - 1,
      endDay,
      23,
      59,
      59,
      999
    );

    if (isNaN(startDateFormat.getTime()) || isNaN(endDateFormat.getTime())) {
      throw new Error("Không đúng định dạng ngày.");
    }

    if (endDateFormat.getTime() < startDateFormat.getTime()) {
      throw new Error("Ngày không hợp lệ");
    }

    // Query for orders within the date range
    const orders = await Order.find({
      createdAt: { $gte: startDateFormat, $lte: endDateFormat },
    });

    let ordersCancelled = 0;
    let ordersSold = 0;
    let totalOrder = 0;
    let orderPending = 0;
    let orderDelivering = 0;

    const monthlyRevenue = Array(12).fill(0); // Tạo mảng 12 phần tử, mỗi phần tử đại diện cho một tháng.

    // Loop through orders to calculate statistics
    orders.forEach((order) => {
      const month = new Date(order.createdAt).getMonth(); // Lấy tháng từ ngày tạo đơn hàng.

      if (order.orderStatus === "CANCELLED") {
        ordersCancelled += 1;
      }
      if (order.orderStatus === "DELIVERED" || order.orderStatus === "PAID") {
        ordersSold += 1;
        totalOrder += order.totalAfterDiscount;
        monthlyRevenue[month] += order.totalAfterDiscount; // Cộng doanh thu vào tháng tương ứng.
      }
      if (order.orderStatus === "PENDING") {
        orderPending += 1;
        totalOrder += order.totalAfterDiscount;
        monthlyRevenue[month] += order.totalAfterDiscount; // Cộng doanh thu vào tháng tương ứng.
      }
      if (order.orderStatus === "DELIVERING") {
        orderDelivering += 1;
        totalOrder += order.totalAfterDiscount;
        monthlyRevenue[month] += order.totalAfterDiscount; // Cộng doanh thu vào tháng tương ứng.
      }
    });

    // Return the calculated statistics
    return {
      totalOrder,
      ordersSold,
      ordersCancelled,
      orderPending,
      orderDelivering,
      monthlyRevenue,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = {
  getOrderStatistics,
};
