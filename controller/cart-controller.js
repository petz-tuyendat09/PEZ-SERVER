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
    } = req.body;

    // Gọi dịch vụ kiểm tra và xử lý sản phẩm trong giỏ hàng
    const updatedCart = await cartServices.handleCartItem(
      productName,
      cartId,
      productId,
      productOption,
      productPrice,
      salePercent
    );

    return res.status(200).json(updatedCart);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
