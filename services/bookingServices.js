const Booking = require("../models/Booking");

exports.findBookingsByDate = async (year, month, day) => {
  try {
    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);

    const bookings = await Booking.find({
      bookingDate: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    return bookings;
  } catch (error) {
    throw new Error("Error fetching bookings by date");
  }
};
