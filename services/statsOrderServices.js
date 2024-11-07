const Order = require("../models/Order");

async function getOrderStatistics({ year, month, day }) {
    const matchConditions = {};

    if (year) {
        matchConditions.createdAt = {
            ...matchConditions.createdAt,
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31),
        };
    }

    if (month) {
        matchConditions.createdAt = {
            ...matchConditions.createdAt,
            $gte: new Date(year, month - 1, 1),
            $lte: new Date(year, month, 0),
        };
    }

    if (day) {
        matchConditions.createdAt = {
            ...matchConditions.createdAt,
            $gte: new Date(year, month - 1, day),
            $lte: new Date(year, month - 1, day, 23, 59, 59, 999),
        };
    }

    try {
        const stats = await Order.aggregate([
            { $match: matchConditions },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalRevenue: { $sum: { $cond: [{ $eq: ["$orderStatus", "DELIVERED"] }, "$orderTotal", 0] } },
                    ordersSold: { $sum: { $cond: [{ $eq: ["$orderStatus", "DELIVERED"] }, 1, 0] } },
                    ordersCancelled: { $sum: { $cond: [{ $eq: ["$orderStatus", "CANCELLED"] }, 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },  // Sắp xếp theo tháng
        ]);

        const monthlyRevenue = new Array(12).fill(0);
        const ordersSold = new Array(12).fill(0);
        const ordersCancelled = new Array(12).fill(0);

        stats.forEach((stat) => {
            monthlyRevenue[stat._id - 1] = stat.totalRevenue;
            ordersSold[stat._id - 1] = stat.ordersSold;
            ordersCancelled[stat._id - 1] = stat.ordersCancelled;
        });

        return { monthlyRevenue, ordersSold, ordersCancelled };
    } catch (error) {
        throw new Error("Error retrieving statistics: " + error.message);
    }

}

module.exports = {
    getOrderStatistics,
};
