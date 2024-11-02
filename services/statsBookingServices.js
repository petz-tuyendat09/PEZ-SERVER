const Booking = require("../models/Booking");

async function getBookingStatistics({ year }) {
    const matchConditions = { bookingStatus: "Done" };

    try {
        const stats = await Booking.aggregate([
            {
                $match: matchConditions
            },
            {
                $group: {
                    _id: { $month: "$bookingDate" },
                    totalRevenue: { $sum: "$totalPrice" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Create an array for monthly revenue with 12 months
        const monthlyRevenue = new Array(12).fill(0);
        stats.forEach(stat => {
            monthlyRevenue[stat._id - 1] = stat.totalRevenue;
        });

        return { monthlyRevenue };
    } catch (error) {
        throw new Error("Error retrieving booking statistics: " + error.message);
    }
}

module.exports = {
    getBookingStatistics,
};
