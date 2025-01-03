const bookingService = require("../services/bookingServices");

exports.queryBooking = async (req, res) => {
  try {
    const {
      bookingId,
      customerName,
      year,
      month,
      day,
      bookingStatus,
      page,
      limit,
    } = req.query;
    const bookings = await bookingService.queryBooking(
      bookingId,
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
      discountAmount,
      totalAfterDiscount,
      voucherId,
      paymentMethod,
    } = req.body;

    const { success, message } = await bookingService.createBooking(
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
    );

    if (success) {
      res.status(200).json({ message: message });
    } else {
      res.status(400).json({ message: message });
    }
  } catch (error) {
    console.log("Error in bookingController:", error);
  }
};

exports.createBookingWithMomo = async (req, res) => {
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
      discountAmount,
      totalAfterDiscount,
      voucherId,
      paymentMethod,
    } = req.body;

    const { success, message, payUrl } =
      await bookingService.createBookingWithMomo(
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
      );

    if (success) {
      res.status(200).json({ payUrl: payUrl });
    } else {
      res.status(400).json({ message: message });
    }
  } catch (error) {
    console.log("Error in bookingController:", error);
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId, userId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking Id là bắt buộc" });
    }

    const bookingResult = await bookingService.cancelBookingById(
      bookingId,
      userId
    );

    if (!bookingResult.found) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (bookingResult.alreadyCanceled) {
      return res.status(404).json({ message: message });
    }
    let message = "Lịch đã được hủy";
    let status = 200;
    if (bookingResult.banned) {
      message = "Tài khoản của bạn đã bị hạn chế";
      status = 500;
    }

    return res.status(status).json({ message: message });
  } catch (error) {
    console.error("Error in cancelBooking:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.doneBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking Id là bắt buco65" });
    }

    const bookingResult = await bookingService.doneBookingById(bookingId);

    if (!bookingResult.found) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (bookingResult.alreadyCanceled) {
      return res
        .status(404)
        .json({ message: "Lịch đã được cập nhật trạng thái" });
    }

    return res.status(200).json({ message: "Cập nhật trạng thái thành công" });
  } catch (error) {
    console.error("Error in cancelBooking:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking Id là bắt buco65" });
    }

    const bookingResult = await bookingService.confirmBookingById(bookingId);

    if (!bookingResult.found) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (bookingResult.alreadyCanceled) {
      return res
        .status(404)
        .json({ message: "Lịch đã được cập nhật trạng thái" });
    }

    return res.status(200).json({ message: "Cập nhật trạng thái thành công" });
  } catch (error) {
    console.error("Error in cancelBooking:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.reviewBooking = async (req, res) => {
  try {
    const { userId, customerName, bookingId, rating, review, services } =
      req.body;

    const result = await bookingService.handleReview({
      userId,
      customerName,
      bookingId,
      rating,
      review,
      services,
    });

    if (!result.success) {
      return res.status(404).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: "Review thành công",
      data: result.data,
      userPoint: result.userPoint,
    });
  } catch (error) {
    console.log("Error in bookingController:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.getReview = async (req, res) => {
  try {
    const { rating, ratingSort, sortByServices, page, limit } = req.query;

    const review = await bookingService.getReview({
      rating,
      ratingSort,
      sortByServices,
      page,
      limit,
    });

    return res.status(200).json(review);
  } catch (error) {
    console.log("Error in bookingController:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
