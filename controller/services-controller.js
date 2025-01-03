const servicesServices = require("../services/servicesServices");

exports.queryServices = async (req, res) => {
  try {
    const filters = {
      serviceId: req.query.serviceId,
      serviceType: req.query.serviceType,
      bookingAmount: req.query.bookingAmount,
    };

    const services = await servicesServices.queryServices(filters);
    return res.status(200).json(services);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.queryServicesPaginate = async (req, res) => {
  try {
    const filters = {
      serviceType: req.query.serviceType,
      bookingAmount: req.query.bookingAmount,
      isHidden: req.query.isHidden,
      page: req.query.page,
      limit: req.query.limit,
    };

    const services = await servicesServices.queryServicesPaginate(filters);
    return res.status(200).json(services);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.insertService = async (req, res) => {
  try {
    const newServiceData = {
      serviceType: req.body.serviceType,
      serviceName: req.body.serviceName,
      servicePrice: req.body.servicePrice,
      serviceDuration: req.body.serviceDuration,
    };

    const service = await servicesServices.insertService(newServiceData);
    return res.status(200).json(service);
  } catch (err) {
    if (err.message === "Trùng tên dịch vụ") {
      return res.status(400).json({ message: "Trùng tên dịch vụ" });
    }
    console.error("Error in insertService controller:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { serviceId } = req.body; // Or req.params or req.query, depending on how the client sends it

    if (!serviceId) {
      return res.status(400).json({ message: "Service ID is required" });
    }

    const deletedService = await servicesServices.deleteService(serviceId);

    if (!deletedService) {
      return res.status(404).json({ message: "Service not found" });
    }

    return res.status(200).json({ message: "Service deleted successfully" });
  } catch (err) {
    console.error("Error in deleteService controller:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const {
      serviceId,
      serviceType,
      serviceName,
      servicePrice,
      serviceDuration,
    } = req.body;

    const updatedServiceData = {
      serviceType,
      serviceName,
      servicePrice,
      serviceDuration,
    };

    const updatedService = await servicesServices.updateService(
      serviceId,
      updatedServiceData
    );

    if (!updatedService) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }

    return res.status(200).json(updatedService);
  } catch (err) {
    if (err.message === "Trùng tên danh mục") {
      return res.status(400).json({ message: "Trùng tên danh mục" });
    }
    console.error("Error in updateService controller:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.toggleService = async (req, res) => {
  try {
    const { serviceId, toggleOption } = req.body;
    const result = await servicesServices.toggleService({
      serviceId,
      toggleOption,
    });

    if (result.success) {
      res.status(200).json({ message: result.message, user: result.user });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.log("Error in getVoucherCanExchange - controller ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
