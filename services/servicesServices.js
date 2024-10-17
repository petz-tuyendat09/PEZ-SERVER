const Services = require("../models/Services");

exports.queryServices = async ({ serviceType, bookingAmount }) => {
  try {
    const query = {};
    let bookingOrder = 1;

    if (serviceType) {
      query.serviceType = new RegExp(serviceType, "i");
    }

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
