const voucherServices = require("../services/voucherServices");

exports.getVoucher = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      pointSort: req.query.pointSort,
      typeFilter: req.query.typeFilter,
      limit: req.query.limit,
      voucherId: req.query.voucherId,
      isHidden: req.query.isHidden,
    };

    const products = await voucherServices.queryVoucher(filters);
    return res.status(200).json(products);
  } catch (error) {
    console.log("Error in getVoucher:  ", error);
  }
};

exports.insertVoucher = async (req, res) => {
  try {
    const {
      limitedDate,
      voucherQuantity,
      voucherType,
      voucherPoint,
      expirationDate,
      maxRedemption,
      voucherDescription,
      flatDiscountAmount,
      salePercent,
      shippingDiscountAmount,
      totalToUse,
    } = req.body;

    const { success, message } = await voucherServices.insertVoucher({
      limitedDate,
      voucherQuantity,
      voucherType,
      voucherPoint,
      expirationDate,
      maxRedemption,
      voucherDescription,
      flatDiscountAmount,
      salePercent,
      shippingDiscountAmount,
      totalToUse,
    });

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
    newExpirationDate,
    newMaxRedemption,
    newTotalToUse,
    newVoucherPoint,
    newVoucherDescription,
    newFlatDiscountAmount,
    newShippingDiscountAmount,
    newVoucherQuantity,
    newLimitedDate,
  } = req.body;

  try {
    if (!editVoucherId) {
      return res.status(400).json({ message: "Voucher ID is required." });
    }

    const updatedVoucher = await voucherServices.editVoucher(
      editVoucherId,
      newVoucherType,
      newVoucherSalePercent,
      newExpirationDate,
      newMaxRedemption,
      newTotalToUse,
      newVoucherPoint,
      newVoucherDescription,
      newFlatDiscountAmount,
      newShippingDiscountAmount,
      newVoucherQuantity,
      newLimitedDate
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

exports.getVoucherCanExchange = async (req, res) => {
  try {
    const { userPoint, page = 1, limit = 10 } = req.query;
    const vouchers = await voucherServices.getVoucherCanExchange(
      userPoint,
      page,
      limit
    );
    res.status(200).json(vouchers);
  } catch (error) {
    console.log("Error in getVoucherCanExchange - controller ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.changeVoucher = async (req, res) => {
  try {
    const { voucherPoint, voucherId, userId } = req.body;

    // Call the service to handle voucher exchange logic
    const result = await voucherServices.changeVoucher(
      voucherPoint,
      voucherId,
      userId
    );

    if (result.success) {
      res.status(200).json({ message: result.message, user: result.user });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.log("Error in changeVoucher controller: ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.toggleVoucher = async (req, res) => {
  try {
    const { voucherId, toggleOption } = req.body;
    const result = await voucherServices.toggleVoucher({
      voucherId,
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
