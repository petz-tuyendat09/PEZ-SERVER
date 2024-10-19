const Booking = require("../models/Booking");

exports.queryBooking = async (
  customerName,
  year,
  month,
  day,
  bookingStatus,
  page = 1,
  limit = 5
) => {
  try {
    const query = {};
    console.log(year, month, day);
    if (year && month && day) {
      const startDate = new Date(year, month - 1, day, 0, 0, 0);
      const endDate = new Date(year, month - 1, day, 23, 59, 59);

      query.bookingDate = {
        $gte: startDate,
        $lte: endDate,
      };
    }
    if (customerName) {
      query.customerName = new RegExp(customerName, "i");
    }

    if (bookingStatus) {
      query.bookingStatus = bookingStatus;
    }

    const skip = (page - 1) * limit;

    const [bookings, totalBookings] = await Promise.all([
      Booking.find(query).skip(skip).limit(parseInt(limit)),
      Booking.countDocuments(query),
    ]);

    return {
      page: parseInt(page),
      totalPages: Math.ceil(totalBookings / limit),
      bookings,
    };
  } catch (error) {
    console.log("Error in queryBooking - BookingServices:", error);
  }
};

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

exports.queryBookingUserId = async (
  userId,
  year,
  month,
  day,
  bookingStatus,
  page = 1,
  limit = 10
) => {
  const query = { userId };

  if (year && month && day) {
    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);

    query.bookingDate = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  if (bookingStatus) {
    query.bookingStatus = bookingStatus;
  }

  const skip = (page - 1) * limit;

  const [bookings, totalBookings] = await Promise.all([
    Booking.find(query).skip(skip).limit(parseInt(limit)),
    Booking.countDocuments(query),
  ]);

  return {
    page: parseInt(page),
    totalPages: Math.ceil(totalBookings / limit),
    bookings,
  };
};

exports.createBooking = async (
  userId,
  customerName,
  customerPhone,
  customerEmail,
  selectedServices,
  totalPrice,
  bookingDate,
  bookingHours
) => {
  try {
    const serviceIds = Object.keys(selectedServices).map((serviceType) => {
      return selectedServices[serviceType].serviceId;
    });

    // Create a new booking object
    const newBooking = new Booking({
      userId: userId,
      customerName: customerName,
      customerEmail: customerEmail,
      customerPhone: customerPhone,
      service: serviceIds,
      bookingDate: new Date(bookingDate),
      bookingHours: bookingHours,
      totalPrice: totalPrice,
    });

    console.log(newBooking);

    // Save the booking to the database
    await newBooking.save();

    return true;
  } catch (error) {
    console.log("Error in bookingServices:", error);
  }
};
