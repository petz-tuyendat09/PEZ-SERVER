const bookingService = require("../services/bookingServices");

exports.queryBooking = async (req, res) => {
  try {
    const { customerName, year, month, day, bookingStatus, page, limit } =
      req.query;
    const bookings = await bookingService.queryBooking(
      customerName,
      year,
      month,
      day,
      bookingStatus,
      page,
      limit
    );

    res.status(200).json(bookings);
  } catch (error) {
    console.log("Error in queryBooking:", error);
  }
};

exports.getBookingByDate = async (req, res) => {
  try {
    const { year, month, day } = req.query;

    const bookings = await bookingService.findBookingsByDate(year, month, day);

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getBookingByUserId = async (req, res) => {
  try {
    const {
      userId,
      year,
      month,
      day,
      bookingStatus,
      page = 1,
      limit = 10,
    } = req.query;

    const bookings = await bookingService.queryBookingUserId(
      userId,
      year,
      month,
      day,
      bookingStatus,
      page,
      limit
    );

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const {
      userId,
      customerName,
      customerPhone,
      customerEmail,
      selectedServices,
      totalPrice,
      bookingDate,
      bookingHours,
    } = req.body;

    console.log(req.body);

    await bookingService.createBooking(
      userId,
      customerName,
      customerPhone,
      customerEmail,
      selectedServices,
      totalPrice,
      bookingDate,
      bookingHours
    );
    res.status(200).json({ message: "Đặt lịch thành công" });
  } catch (error) {
    console.log("Error in bookingController:", error);
  }
};
