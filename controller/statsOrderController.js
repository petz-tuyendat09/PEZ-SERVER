const statsOrderServices = require("../services/statsOrderServices");

async function getStatistics(req, res) {
  const { startDate, endDate, day, month, year } = req.query;

  try {
    const stats = await statsOrderServices.getOrderStatistics({
      startDate,
      endDate,
      day,
      month,
      year,
    });
    res.json(stats);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getStatistics,
};
