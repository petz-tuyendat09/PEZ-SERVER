const { getBookingStatistics } = require("../services/statsBookingServices");

async function getStatistics(req, res) {
    const { year } = req.query;

    try {
        const stats = await getBookingStatistics({ year });
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving booking statistics", error: error.message });
    }
}

module.exports = {
    getStatistics,
};
