const Order = require("../models/Order");

async function getOrderStatistics({ year }) {
    const matchConditions = { orderStatus: "DELIVERED" };

    try {
        const stats = await Order.aggregate([
            {
                $match: matchConditions
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalRevenue: { $sum: "$orderTotal" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Tạo mảng doanh thu hàng tháng với 12 tháng
        const monthlyRevenue = new Array(12).fill(0);
        stats.forEach(stat => {
            monthlyRevenue[stat._id - 1] = stat.totalRevenue; // Gán doanh thu cho tháng tương ứng
        });

        return { monthlyRevenue };
    } catch (error) {
        throw new Error("Error retrieving statistics: " + error.message);
    }
}


module.exports = {
    getOrderStatistics,
};
