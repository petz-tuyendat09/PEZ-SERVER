const servicesServices = require("../services/servicesServices");

exports.queryServices = async (req, res) => {
  try {
    const filters = {
      serviceType: req.query.serviceType,
      bookingAmount: req.query.bookingAmount,
    };

    const services = await servicesServices.queryServices(filters);
    return res.status(200).json(services);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
