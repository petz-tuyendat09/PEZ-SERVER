// app/services/userService.js
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Cart = require("../models/Cart");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 10; // Bạn có thể điều chỉnh số vòng salt theo nhu cầu

/**
 * Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu chưa
 * @param {string} email - Email của user
 * @returns {Promise<boolean>}
 */
exports.isEmailExists = async (email) => {
  const existingEmail = await User.findOne({ userEmail: email });
  return !!existingEmail;
};

/**
 * Kiểm tra xem username đã tồn tại trong cơ sở dữ liệu chưa
 * @param {string} username - Username
 * @returns {Promise<boolean>}
 */
exports.isUsernameExists = async (username) => {
  const existingUsername = await User.findOne({ username: username });
  return !!existingUsername;
};

/**
 * Tạo người dùng mới và giỏ hàng liên kết
 * @param {object} userData - Thông tin user điền ở client
 * @returns {Promise<object>} Trả về thông tin người dùng mới tạo
 */
exports.createUser = async ({ email, username, password }) => {
  // Hash mật khẩu
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Tạo người dùng mới
  const newUser = new User({
    username,
    password: hashedPassword,
    userEmail: email,
  });

  // Lưu người dùng vào cơ sở dữ liệu
  await newUser.save();

  // Tạo giỏ hàng mới liên kết với người dùng
  const newCart = new Cart({
    userId: newUser._id,
  });

  // Lưu giỏ hàng vào cơ sở dữ liệu
  await newCart.save();

  return newUser;
};

/**
 * Xác thực người dùng dựa trên username hoặc email và mật khẩu
 * @param {string} identifier - Username hoặc email
 * @param {string} password - Mật khẩu người dùng
 * @returns {Promise<object|null>} Trả về thông tin người dùng nếu xác thực thành công, ngược lại trả về null
 */
exports.authenticateUser = async (identifier, password) => {
  const existingUser = await User.findOne({
    $or: [{ username: identifier }, { userEmail: identifier }],
  });

  if (!existingUser) return null;

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);
  if (!isPasswordValid) return null;

  return existingUser;
};

/**
 * Tạo JWT token
 * @param {string} userId - ID người dùng
 * @param {string} secret - JWT secret key
 * @param {string} expiresIn - Thời gian hết hạn của token
 * @returns {string} Trả về JWT token
 */
exports.generateToken = (userId, secret, expiresIn) => {
  return jwt.sign({ id: userId }, secret, { expiresIn });
};

/**
 * Tạo refresh token
 * @param {string} userId - ID người dùng
 * @param {string} secret - JWT refresh secret key
 * @param {string} expiresIn - Thời gian hết hạn của refresh token
 * @returns {string} Trả về refresh token
 */
exports.generateRefreshToken = (userId, secret, expiresIn) => {
  return jwt.sign({ id: userId }, secret, { expiresIn });
};

// app/services/authService.js

/**
 * Xác minh refresh token
 * @param {string} refreshToken - Refresh token cần xác minh
 * @param {string} secret - JWT refresh secret key
 * @returns {object|null} Trả về payload nếu token hợp lệ, ngược lại trả về null
 */
exports.verifyRefreshToken = (refreshToken, secret) => {
  try {
    return jwt.verify(refreshToken, secret);
  } catch (error) {
    return null;
  }
};

/**
 * Tạo JWT token mới
 * @param {string} userId - ID người dùng
 * @param {string} secret - JWT secret key
 * @param {string} expiresIn - Thời gian hết hạn của token
 * @returns {string} Trả về JWT token mới
 */
exports.generateToken = (userId, secret, expiresIn) => {
  return jwt.sign({ id: userId }, secret, { expiresIn });
};

/**
 * Tạo refresh token mới
 * @param {string} userId - ID người dùng
 * @param {string} secret - JWT refresh secret key
 * @param {string} expiresIn - Thời gian hết hạn của refresh token
 * @returns {string} Trả về refresh token mới
 */
exports.generateRefreshToken = (userId, secret, expiresIn) => {
  return jwt.sign({ id: userId }, secret, { expiresIn });
};
