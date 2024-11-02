const cartServices = require("../services/cartServices");

exports.insertCart = async (req, res) => {
  try {
    const {
      cartId,
      productName,
      productId,
      productPrice,
      productOption,
      salePercent,
      productSlug,
      productImage,
      userId,
    } = req.body;

    const updatedCart = await cartServices.handleCartItem(
      productName,
      cartId,
      productId,
      productOption,
      productPrice,
      salePercent,
      productImage,
      productSlug,
      userId
    );

    return res.status(200).json(updatedCart);
  } catch (err) {
    console.log("Error in insertCart", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.quantityAdjust = async (req, res) => {
  try {
    const { adjustOption, cartId, productId, productOption } = req.body;

    const updatedCart = await cartServices.adjustQuantity(
      adjustOption,
      cartId,
      productId,
      productOption
    );

    if (!updatedCart) {
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
    }

    return res.status(200).json(updatedCart);
  } catch (error) {
    console.error("Error in quantityAdjust:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const { cartId, productId, productOption } = req.body;

    const updatedCart = await cartServices.removeProductFromCart(
      cartId,
      productId,
      productOption
    );

    if (!updatedCart) {
      return res.status(404).json({ message: "Cart or Product not found" });
    }

    return res.status(200).json(updatedCart);
  } catch (error) {
    console.error("Error in removeItem:", error);
    return res.status(500).json({ error: error.message });
  }
};
