const Booking = require("../models/Booking");
const Service = require("../models/Services");
const Review = require("../models/Review");
const User = require("../models/User");

const moment = require("moment");
const { sendBookingEmail } = require("../utils/sendBookingEmail");

exports.queryBooking = async (
  bookingId,
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

    if (bookingId) {
      query._id = bookingId;
    }

    const skip = (page - 1) * limit;

    let bookingQuery = Booking.find(query).skip(skip).limit(parseInt(limit));

    // Populate services only when querying by bookingId
    if (bookingId) {
      bookingQuery = bookingQuery.populate("service");
    }

    const [bookings, totalBookings] = await Promise.all([
      bookingQuery,
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
      bookingStatus: { $ne: "Cancel" },
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
    // Extract service IDs from the selectedServices object
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

    // Save the booking to the database
    await newBooking.save();

    // Increment the booking amount for each service
    for (const serviceId of serviceIds) {
      await Service.findByIdAndUpdate(serviceId, {
        $inc: { bookingAmount: 1 },
      });
    }

    // Tìm chi tiết dịch vụ đã đặt
    const servicesDetails = await Service.find({
      _id: { $in: serviceIds },
    });

    sendBookingEmail(customerEmail, {
      customerName,
      servicesDetails,
      totalPrice,
      bookingDate,
      bookingHours,
    });

    return true;
  } catch (error) {
    console.log("Error in bookingServices:", error);
    return false;
  }
};

exports.cancelBookingById = async (bookingId) => {
  try {
    // Find the booking first to check its current status
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      // If no booking found, return false to indicate not found
      return { found: false };
    }

    // Check if the booking is already canceled
    if (booking.bookingStatus === "Canceled") {
      return { alreadyCanceled: true };
    }

    // Update the booking status to "Canceled"
    booking.bookingStatus = "Canceled";
    await booking.save();

    return { found: true, alreadyCanceled: false };
  } catch (error) {
    console.error("Error in cancelBookingById:", error);
    return { found: false, error: true };
  }
};

exports.checkAndCancelPendingBookings = async () => {
  try {
    // Get the current date and time
    const currentTime = moment();
    console.log(currentTime);

    const pendingBookings = await Booking.find({
      bookingDate: {
        $gte: moment(currentTime).startOf("day").toDate(),
        $lt: moment(currentTime).endOf("day").toDate(),
      },
      bookingStatus: "Booked",
    });

    for (const booking of pendingBookings) {
      const bookingHourMoment = moment(
        `${moment(currentTime).format("YYYY-MM-DD")} ${booking.bookingHours}`,
        "YYYY-MM-DD HH:mm"
      );

      if (bookingHourMoment.isBefore(currentTime)) {
        await Booking.findByIdAndUpdate(booking._id, {
          bookingStatus: "Canceled",
        });
        console.log(
          `Booking ID ${booking._id} has been canceled due to inactivity.`
        );
      }
    }
  } catch (error) {
    console.error("Error in checkAndCancelPendingBookings:", error);
  }
};

exports.handleReview = async ({
  userId,
  customerName,
  bookingId,
  rating,
  review,
  services,
}) => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return { success: false, message: "Booking not found" };
    }

    const newReview = await Review.create({
      bookingId,
      userId,
      rating,
      comment: review,
      customerName,
      services,
    });

    booking.reviewStatus = true;
    await booking.save();

    let additionalPoints = 50;

    const wordCount = review.trim().split(/\s+/).length;
    if (wordCount > 50) {
      additionalPoints += 50;
    }

    const user = await User.findById(userId);
    if (user) {
      user.userPoint = (user.userPoint || 0) + additionalPoints;
      await user.save();
    }

    return { success: true, userPoint: user.userPoint, data: newReview };
  } catch (error) {
    console.log("Error in bookingServices // bookingController:", error);
    return {
      success: false,
      message: "Error handling review",
      error: error.message,
    };
  }
};
