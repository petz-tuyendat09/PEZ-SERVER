const Order = require("../models/Order");

async function getOrderStatistics({ startDate, endDate }) {
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

        // Query for orders within the date range
        const orders = await Order.find({
            createdAt: { $gte: startDateFormat, $lte: endDateFormat },
        });

        let ordersCancelled = 0;
        let ordersSold = 0;
        let totalRevenue = 0;

        // Loop through orders to calculate statistics
        orders.forEach((order) => {
            if (order.orderStatus === "CANCELLED") {
                ordersCancelled += 1;
            }
            if (order.orderStatus === "DELIVERED") {
                ordersSold += 1;
                totalRevenue += order.totalAfterDiscount;
            }
        });

        // Return the calculated statistics
        return { totalRevenue, ordersSold, ordersCancelled };

    } catch (error) {
        console.error(error);
        throw error;
    }
}


module.exports = {
    getOrderStatistics,
};
