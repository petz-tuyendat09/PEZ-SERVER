const Booking = require("../models/Booking");
const Service = require("../models/Services");
const Review = require("../models/Review");
const User = require("../models/User");
const UserService = require("../services/userServices");
const { sendBannedEmail } = require("../utils/sendBannedEmail");

const moment = require("moment");
const { sendBookingEmail } = require("../utils/sendBookingEmail");
const { default: mongoose } = require("mongoose");
const momoPaymentBooking = require("../momo/momoBooking");

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
      const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));

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

    let bookingQuery = Booking.find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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
    const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));

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
    Booking.find(query).sort({ _id: -1 }).skip(skip).limit(parseInt(limit)),
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
  bookingHours,
  discountAmount,
  totalAfterDiscount,
  voucherId,
  paymentMethod
) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.toISOString().split("T")[0]); // 00:00:00 UTC
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(startOfDay.getUTCDate() + 1); // 00:00:00 ngày mai UTC

    const bookingsToday = await Booking.countDocuments({
      userId: userId,
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    const maxBookingsPerDay = 5;
    if (bookingsToday >= maxBookingsPerDay) {
      return {
        success: false,
        message: "Bạn đã đạt tối đa số lần đặt lịch trong ngày.",
      };
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

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
      totalAfterDiscount: totalAfterDiscount,
      voucherId: voucherId ? voucherId : null,
      discountAmount: discountAmount,
      paymentMethod: paymentMethod,
    });

    // Save the booking to the database
    await newBooking.save();
    if (voucherId) {
      await UserService.decreaseUserVoucher(userId, voucherId);
    }

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

    return {
      success: true,
      message: "Đặt lịch thành công.",
    };
  } catch (error) {
    console.log("Error in bookingServices:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra. Vui lòng thử lại sau.",
    };
  }
};

exports.createBookingWithMomo = async (
  userId,
  customerName,
  customerPhone,
  customerEmail,
  selectedServices,
  totalPrice,
  bookingDate,
  bookingHours,
  discountAmount,
  totalAfterDiscount,
  voucherId,
  paymentMethod
) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.toISOString().split("T")[0]); // 00:00:00 UTC
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(startOfDay.getUTCDate() + 1); // 00:00:00 ngày mai UTC

    const bookingsToday = await Booking.countDocuments({
      userId: userId,
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    const maxBookingsPerDay = 900;
    if (bookingsToday >= maxBookingsPerDay) {
      return {
        success: false,
        message: "Bạn đã đạt tối đa số lần đặt lịch trong ngày.",
      };
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

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
      totalAfterDiscount: totalAfterDiscount,
      voucherId: voucherId !== "" ? voucherId : null,
      discountAmount: discountAmount,
      paymentMethod: paymentMethod,
    });

    // Save the booking to the database
    await newBooking.save();
    if (voucherId !== "") {
      await UserService.decreaseUserVoucher(userId, voucherId);
    }

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

    const response = await momoPaymentBooking(
      totalAfterDiscount,
      newBooking._id
    );

    return {
      payUrl: response.payUrl,
      success: true,
      message: "Đặt lịch thành công.",
    };
  } catch (error) {
    console.log("Error in bookingServices:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra. Vui lòng thử lại sau.",
    };
  }
};

exports.cancelBookingById = async (bookingId, userId) => {
  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return { found: false };
    }

    if (booking.bookingStatus === "Canceled") {
      return { alreadyCanceled: true };
    }

    let banned = false;

    if (userId) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const canceledBookingsCount = await Booking.countDocuments({
        userId: userId,
        bookingStatus: "Canceled",
        bookingDate: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      });

      if (canceledBookingsCount >= 5) {
        const user = await User.findById(userId);
        user.bannedUser = true;

        await user.save();
        sendBannedEmail(user.displayName, user.userEmail);
        banned = true;
      }
    }
    booking.bookingStatus = "Canceled";
    await booking.save();

    return { found: true, alreadyCanceled: false, banned: banned };
  } catch (error) {
    console.error("Error in cancelBookingById:", error);
    return { found: false, error: true };
  }
};

exports.doneBookingById = async (bookingId) => {
  try {
    // Find the booking first to check its current status
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return { found: false };
    }

    if (booking.bookingStatus === "Done") {
      return { alreadyDone: true };
    }

    booking.bookingStatus = "Done";
    await booking.save();

    return { found: true, alreadyDone: false };
  } catch (error) {
    console.error("Error in cancelBookingById:", error);
    return { found: false, error: true };
  }
};

exports.confirmBookingById = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return { found: false };
    }

    if (booking.bookingStatus === "Confirm") {
      return { alreadyDone: true };
    }

    booking.bookingStatus = "Confirm";
    await booking.save();

    return { found: true, alreadyDone: false };
  } catch (error) {
    console.error("Error in confirmBookingById:", error);
    return { found: false, error: true };
  }
};

exports.checkAndCancelPendingBookings = async () => {
  try {
    // Get the current date and time
    const currentTime = moment();

    const pendingBookings = await Booking.find({
      bookingDate: {
        $gte: moment(currentTime).utc().startOf("day").toDate(),
        $lt: moment(currentTime).utc().endOf("day").toDate(),
      },
      bookingStatus: "Booked",
    });

    for (const booking of pendingBookings) {
      const bookingHourMoment = moment(
        `${moment(currentTime).format("YYYY-MM-DD")} ${booking.bookingHours}`,
        "YYYY-MM-DD HH:mm"
      );
      console.log(bookingHourMoment);

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

// services
exports.getReview = async ({
  rating,
  ratingSort,
  sortByServices,
  page,
  limit,
}) => {
  try {
    // Tạo điều kiện lọc theo rating nếu có
    let filter = {};
    if (rating) {
      filter.rating = rating;
    }

    // Xây dựng truy vấn sắp xếp
    let sort = {};
    if (ratingSort) {
      sort.rating = ratingSort === "asc" ? 1 : -1; // Sắp xếp rating theo thứ tự tăng dần hoặc giảm dần
    }

    if (sortByServices) {
      sort.services = sortByServices === "asc" ? 1 : -1; // Sắp xếp số dịch vụ theo thứ tự tăng dần hoặc giảm dần
    }

    // Thiết lập phân trang
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Truy vấn dữ liệu từ MongoDB với phân trang
    const reviews = await Review.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .populate("services");

    // Tổng số lượng đánh giá để tính toán phân trang
    const totalReviews = await Review.countDocuments(filter);

    return {
      reviews,
      totalPages: Math.ceil(totalReviews / pageSize),
      currentPage: pageNumber,
    };
  } catch (error) {
    console.log("Error in reviewService:", error);
    throw new Error("Lỗi khi lấy đánh giá");
  }
};
