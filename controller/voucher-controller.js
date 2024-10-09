const voucherServices = require("../services/voucherServices");

exports.getVoucher = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      salePercentSort: req.query.salePercentSort,
      pointSort: req.query.pointSort,
      typeFilter: req.query.typeFilter,
      limit: req.query.limit,
    };

    const products = await voucherServices.queryVoucher(filters);
    return res.status(200).json(products);
  } catch (error) {
    console.log("Error in getVoucher:  ", error);
  }
};
