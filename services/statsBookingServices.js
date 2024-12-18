const Booking = require("../models/Booking");

async function getBookingStatistics({ startDate, endDate }) {
  try {
    // Parse the date strings into components
    const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
    const [endYear, endMonth, endDay] = endDate.split("-").map(Number);

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

    // Query for bookings within the date range
    const bookings = await Booking.find({
      bookingDate: { $gte: startDateFormat, $lte: endDateFormat },
    });

    let totalBooking = 0;
    let bookingsDone = 0;
    let bookingsCancelled = 0;

    const monthlyRevenue = Array(12).fill(0); // Tạo mảng 12 phần tử, mỗi phần tử đại diện cho một tháng.

    // Loop through bookings to calculate statistics
    bookings.forEach((booking) => {
      const month = new Date(booking.bookingDate).getMonth(); // Lấy tháng từ ngày tạo đơn hàng.

      if (booking.bookingStatus === "Canceled") {
        bookingsCancelled += 1;
      }
      if (booking.bookingStatus === "Done") {
        bookingsDone += 1;
        totalBooking += booking.totalPrice;
        monthlyRevenue[month] += booking.totalPrice; // Cộng doanh thu vào tháng tương ứng.
      }
    });

    // Return the calculated statistics
    return { totalBooking, bookingsDone, bookingsCancelled, monthlyRevenue };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = {
  getBookingStatistics,
};
