const Booking = require("../models/Booking");

async function getBookingStatistics({ startDate, endDate }) {
    try {
        // Parse the date strings into components
        const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
        const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

        // Create Date objects (months are zero-indexed)
        const startDateFormat = new Date(startYear, startMonth - 1, startDay);
        const endDateFormat = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

        // Validate the Date objects
        if (isNaN(startDateFormat.getTime()) || isNaN(endDateFormat.getTime())) {
            throw new Error('Invalid date format. Please use "YYYY-MM-DD".');
        }

        // Query for bookings within the date range
        const bookings = await Booking.find({
            bookingDate: { $gte: startDateFormat, $lte: endDateFormat },
        });

        let totalBooking = 0;
        let bookingsDone = 0;
        let bookingsCancelled = 0;

        // Loop through bookings to calculate statistics
        bookings.forEach((booking) => {
            if (booking.bookingStatus === "Canceled") {
                bookingsCancelled += 1;
            }
            if (booking.bookingStatus === "Done") {
                bookingsDone += 1;
                totalBooking += booking.totalPrice;
            }
        });

        // Return the calculated statistics
        return { totalBooking, bookingsDone, bookingsCancelled };

    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = {
    getBookingStatistics,
};
