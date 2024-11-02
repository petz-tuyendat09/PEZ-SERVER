const Cart = require("../models/Cart");
const checkExistItem = async (cartId, productOption, productId) => {
  try {
    // Tìm cart theo cartId
    const cart = await Cart.findById(cartId);
    if (!cart) {
      return;
    }

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
    return;
  } catch (error) {
    console.log(error);
    throw new Error("Error checking item existence in cart");
  }
};

const addNewItemToCart = async (
  productName,
  cartId,
  productId,
  productOption,
  productPrice,
  salePercent,
  productImage,
  productSlug,
  userId
) => {
  try {
    const cart = await Cart.findById(cartId);
    if (!cart) throw new Error("Cart not found");
    cart.cartItems.push({
      productId: productId,
      productName: productName,
      productQuantity: 1,
      productPrice: productPrice,
      productOption: productOption,
      salePercent: salePercent,
      productImage: productImage,
      productSlug: productSlug,
    });
    cart.userId = userId;
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
  salePercent,
  productImage,
  productSlug,
  productQuantity,
  userId
) => {
  // Kiểm tra sản phẩm có trùng productId và productOption không
  const existingItem = await checkExistItem(cartId, productOption, productId);
  // Nếu không trùng hoặc productOption khác, thêm sản phẩm mới
  if (!existingItem) {
    return await addNewItemToCart(
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
  } else {
    existingItem.cartItems[0].productQuantity += productQuantity;
  }

  // Nếu sản phẩm trùng, trả về cart đã được cập nhật
  return existingItem;
};

exports.adjustQuantity = async (
  adjustOption,
  cartId,
  productId,
  productOption
) => {
  const cart = await Cart.findById(cartId);

  if (!cart) {
    throw new Error("Cart not found");
  }

  if (adjustOption === "clearAll") {
    cart.cartItems = []; // Clear all items
    await cart.save();
    return cart;
  }

  // Find the correct item in the cart
  const itemIndex = cart.cartItems.findIndex(
    (item) =>
      item.productId.toString() === productId &&
      item.productOption === productOption
  );

  if (itemIndex === -1) {
    throw new Error("Product not found in the cart");
  }

  // Adjust the quantity
  if (adjustOption === "increase") {
    cart.cartItems[itemIndex].productQuantity += 1;
  } else if (adjustOption === "decrease") {
    cart.cartItems[itemIndex].productQuantity -= 1;

    // If quantity becomes less than 1, remove the item from the cart
    if (cart.cartItems[itemIndex].productQuantity < 1) {
      cart.cartItems.splice(itemIndex, 1);
    }
  } else {
    throw new Error("Invalid adjust option");
  }

  // Save the updated cart
  await cart.save();
  return cart;
};

exports.removeProductFromCart = async (cartId, productId, productOption) => {
  const cart = await Cart.findById(cartId);

  if (!cart) {
    throw new Error("Cart not found");
  }

  // Tìm sản phẩm trong giỏ hàng dựa vào productId và productOption
  const itemIndex = cart.cartItems.findIndex(
    (item) =>
      item.productId.toString() === productId &&
      item.productOption === productOption
  );

  if (itemIndex === -1) {
    throw new Error("Product not found in the cart");
  }

  // Xóa sản phẩm khỏi giỏ hàng
  cart.cartItems.splice(itemIndex, 1);

  // Lưu lại giỏ hàng sau khi cập nhật
  await cart.save();

  return cart;
};
