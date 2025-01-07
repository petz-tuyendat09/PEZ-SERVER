const Services = require("../models/Services");

exports.queryServices = async ({ serviceType, bookingAmount, serviceId }) => {
  try {
    const query = {};
    let bookingOrder = 1;

    query.isHidden = false;

    if (serviceType) {
      query.serviceType = new RegExp(serviceType, "i");
    }

    if (serviceId) {
      query._id = serviceId;
    }

    console.log(serviceId);

    if (bookingAmount == "desc") {
      bookingOrder = -1;
    } else if (bookingAmount == "asc") {
      bookingOrder = 1;
    }

    let queryResult = Services.find(query).sort({
      bookingAmount: bookingOrder,
    });

    const services = await queryResult;
    return services;
  } catch (error) {
    console.log("Error in queryServices:", error);
  }
};

exports.queryServicesPaginate = async ({
  serviceType,
  bookingAmount,
  serviceId,
  page = 1, // Default page is 1 if not provided
  limit = 10, // Default limit is 10 if not provided
  isHidden,
}) => {
  try {
    const query = {};
    let bookingOrder = 1;

    // Handle filtering by service type using a case-insensitive regular expression
    if (serviceType) {
      query.serviceType = new RegExp(serviceType, "i");
    }

    if (isHidden) {
      query.isHidden = isHidden;
    }

    // Handle sorting by bookingAmount based on query parameters
    if (bookingAmount === "desc") {
      bookingOrder = -1;
    } else if (bookingAmount === "asc") {
      bookingOrder = 1;
    }

    // Calculate pagination parameters
    const skip = (page - 1) * limit; // Number of documents to skip
    const limitValue = parseInt(limit); // Convert limit to a number

    // Build the query with sorting, pagination, and filtering
    const queryResult = await Services.find(query)
      .sort({ bookingAmount: bookingOrder }) // Sorting based on bookingAmount
      .skip(skip) // Skip documents for pagination
      .limit(limitValue); // Limit the number of documents per page

    // Count the total number of documents matching the query for pagination metadata
    const totalDocuments = await Services.countDocuments(query);

    return {
      services: queryResult,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalDocuments / limitValue),
    };
  } catch (error) {
    console.log("Error in queryServicesPaginate:", error);
    throw error;
  }
};

exports.insertService = async ({
  serviceName,
  serviceType,
  servicePrice,
  serviceDuration,
}) => {
  try {
    const existingService = await Services.findOne({
      serviceName,
      serviceType,
    });

    if (existingService) {
      throw new Error("Trùng tên dịch vụ");
    }

    const newService = new Services({
      serviceName,
      serviceType,
      servicePrice,
      serviceDuration,
    });

    const savedService = await newService.save();

    return savedService;
  } catch (error) {
    console.error("Error in insertService:", error);
    throw error;
  }
};

exports.deleteService = async (serviceId) => {
  try {
    // Find the service by ID and delete it
    const deletedService = await Services.findByIdAndDelete(serviceId);

    // If the service was not found, deletedService will be null
    return deletedService;
  } catch (error) {
    console.error("Error in deleteService:", error);
    throw error; // Re-throw the error to be handled in the controller
  }
};

exports.updateService = async (serviceId, updatedServiceData) => {
  try {
    // Check if the service exists
    const existingService = await Services.findById(serviceId);
    if (!existingService) {
      return null; // Service not found
    }

    // Check for duplicate serviceName and serviceType (excluding the current service)
    const duplicateService = await Services.findOne({
      _id: { $ne: serviceId },
      serviceName: updatedServiceData.serviceName,
      serviceType: updatedServiceData.serviceType,
    });

    if (duplicateService) {
      throw new Error("Trùng tên danh mục");
    }

    // Update the service
    const updatedService = await Services.findByIdAndUpdate(
      serviceId,
      updatedServiceData,
      { new: true }
    );

    return updatedService;
  } catch (error) {
    console.error("Error in updateService:", error);
    throw error;
  }
};

exports.toggleService = async ({ serviceId, toggleOption }) => {
  try {
    await Services.findByIdAndUpdate(serviceId, { isHidden: toggleOption });
    return { success: true, message: "Cập nhật thành công" };
  } catch (error) {
    console.log(error.message);
    return { success: false, message: "Cập nhật thất bại" };
  }
};
