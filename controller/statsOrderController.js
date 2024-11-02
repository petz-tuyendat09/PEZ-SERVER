const statsOrderServices = require("../services/statsOrderServices");

async function getStatistics(req, res) {
    const { day, month, year } = req.query;

    try {
        const stats = await statsOrderServices.getOrderStatistics({ day, month, year });
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getStatistics,
};
