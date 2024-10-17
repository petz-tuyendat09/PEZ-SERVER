const bookingService = require("../services/bookingServices");

exports.getBookingByDate = async (req, res) => {
  try {
    const { year, month, day } = req.query;

    console.log(year, month, day);
    const bookings = await bookingService.findBookingsByDate(year, month, day);

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
