const Cart = require("../models/Cart");
const checkExistItem = async (cartId, productOption, productId) => {
  try {
    // Tìm cart theo cartId
    const cart = await Cart.findById(cartId);
    if (!cart) throw new Error("Cart not found");

    // Tìm tất cả sản phẩm có productId trùng
    const existingItems = cart.cartItems.filter((item) =>
      item.productId.equals(productId)
    );

    // Kiểm tra từng sản phẩm với productOption
    for (let item of existingItems) {
      if (item.productOption === productOption) {
        // Nếu productOption trùng, tăng productQuantity
        item.productQuantity += 1;
        await cart.save();
        return cart;
      }
    }

    // Nếu không có sản phẩm nào trùng cả productId và productOption
    return null;
  } catch (error) {
    console.log(error);
    throw new Error("Error checking item existence in cart");
  }
};

const addNewItemToCart = async (
  cartId,
  productId,
  productOption,
  productName,
  productPrice,
  salePercent
) => {
  try {
    const cart = await Cart.findById(cartId);
    if (!cart) throw new Error("Cart not found");

    // Thêm sản phẩm mới vào giỏ hàng
    cart.cartItems.push({
      productId: productId,
      productName: productName,
      productQuantity: 1,
      productPrice: productPrice,
      productOption: productOption,
      salePercent: salePercent,
    });

    await cart.save();
    return cart;
  } catch (error) {
    console.log(error);
    throw new Error("Error adding new item to cart");
  }
};

exports.handleCartItem = async (
  productName,
  cartId,
  productId,
  productOption,
  productPrice,
  salePercent
) => {
  // Kiểm tra sản phẩm có trùng productId và productOption không
  const existingItem = await checkExistItem(cartId, productOption, productId);

  // Nếu không trùng hoặc productOption khác, thêm sản phẩm mới
  if (!existingItem) {
    return await addNewItemToCart(
      cartId,
      productId,
      productOption,
      productName,
      productPrice,
      salePercent
    );
  }

  // Nếu sản phẩm trùng, trả về cart đã được cập nhật
  return existingItem;
};
