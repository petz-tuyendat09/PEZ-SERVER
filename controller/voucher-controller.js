const voucherServices = require("../services/voucherServices");

exports.getVoucher = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      salePercentSort: req.query.salePercentSort,
      pointSort: req.query.pointSort,
      typeFilter: req.query.typeFilter,
      limit: req.query.limit,
      voucherId: req.query.voucherId,
    };

    const products = await voucherServices.queryVoucher(filters);
    return res.status(200).json(products);
  } catch (error) {
    console.log("Error in getVoucher:  ", error);
  }
};

exports.insertVoucher = async (req, res) => {
  try {
    const { voucherType, salePercent, voucherPoint, voucherDescription } =
      req.body;

    // Log the received data for debugging
    console.table([voucherType, salePercent, voucherPoint, voucherDescription]);

    // Call the service to insert the voucher
    const { success, message } = await voucherServices.insertVoucher(
      voucherType,
      salePercent,
      voucherPoint,
      voucherDescription
    );

    if (!success) {
      return res.status(401).json({
        message: message,
      });
    }

    return res.status(201).json({
      message: message,
    });
  } catch (error) {
    console.log("Error in insertVoucher:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteVoucher = async (req, res) => {
  try {
    const { deleteVoucherId } = req.body;

    if (!deleteVoucherId) {
      return res.status(400).json({ message: "Voucher ID is required." });
    }

    if (Array.isArray(deleteVoucherId)) {
      result = await voucherServices.deleteMultipleVoucher(deleteVoucherId);
    } else {
      result = await voucherServices.deleteVoucher(deleteVoucherId);
    }

    if (!result) {
      return res.status(404).json({ message: "Voucher not found." });
    }

    return res.status(200).json({ message: "Voucher deleted successfully." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error. Could not delete voucher." });
  }
};

exports.editVoucher = async (req, res) => {
  const {
    editVoucherId,
    newVoucherType,
    newVoucherSalePercent,
    newVoucherPoint,
    newVoucherDescription,
  } = req.body;

  try {
    if (!editVoucherId) {
      return res.status(400).json({ message: "Voucher ID is required." });
    }

    const updatedVoucher = await voucherServices.editVoucher(
      editVoucherId,
      newVoucherType,
      newVoucherSalePercent,
      newVoucherPoint,
      newVoucherDescription
    );

    if (!updatedVoucher) {
      return res.status(404).json({ message: "Voucher not found." });
    }

    return res
      .status(200)
      .json({ message: "Voucher updated successfully.", updatedVoucher });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error. Could not update voucher." });
  }
};
