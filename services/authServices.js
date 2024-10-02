// app/services/userService.js
const bcrypt = require("bcrypt");
const User = require("../models/User");
const TempUser = require("../models/TempUser")
const Cart = require("../models/Cart");
const jwt = require("jsonwebtoken");
const SALT_ROUNDS = 10; 
const sendOTPUtils = require("../utils/sendOTP")


/**
 * Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu chưa
 * @param {string} email - Email của user
 * @returns {Promise<boolean>} - Trả về `true` nếu email tồn tại, ngược lại `false`
 */
exports.isEmailExists = async (email) => {
  const existingEmail = await User.findOne({ userEmail: email });
  return !!existingEmail;
};

/**
 * Kiểm tra xem username đã tồn tại trong cơ sở dữ liệu chưa
 * @param {string} username - Username của user
 * @returns {Promise<boolean>} - Trả về `true` nếu username tồn tại, ngược lại `false`
 */
exports.isUsernameExists = async (username) => {
  const existingUsername = await User.findOne({ username: username });
  return !!existingUsername;
};

/**
 * Kiểm tra xem tempuser đã tồn tại trong cơ sở dữ liệu chưa sau đấy làm mới tempuser
 * @param {string} email - email user đăng ký
 * @param {string} otp - mã OTPs được server tạo
 * @returns {Promise<boolean>} - Trả về `true` nếu username tồn tại, ngược lại `false`
 */

const isTempUserExists = async (email,otp) => {

  let tempUser = await TempUser.findOne({ userEmail: email });

  if (!tempUser) return (success = false);

  username = tempUser.username;
  password = tempUser.password;
  email = tempUser.userEmail;
  await TempUser.deleteOne({ userEmail: email });

  const newTempUser = new TempUser({
      userEmail: email,
      username: username,
      password: password,
      otp: otp,
    });
  await newTempUser.save();
  return true;
};

/**
 * Lưu người dùng tạm thời (chưa xác thực OTP) vào cơ sở dữ liệu
 * @param {object} param0 - Đối tượng chứa thông tin user
 * @param {string} param0.email - Email của user
 * @param {string} param0.username - Username của user
 * @param {string} param0.password - Mật khẩu của user (chưa mã hóa)
 * @param {string} param0.otp - OTP để xác thực user
 * @returns {Promise<void>}
 */
exports.saveTempUser = async ({ email, username, password, otp }) => {
  try {

   const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Check xem đã tồn tại chưa 
    let duplicated = await isTempUserExists(email,otp);

    if(duplicated) {
      return true;
    }
  
    // Chưa có thì tạo giùm cái
    const tempUser = new TempUser({
      userEmail: email,
      username: username,
      password: hashedPassword,
      otp,
    });
    await tempUser.save();
    return true;
  } catch (error) {
    console.log("Error at  saveTempUser:", error);
  }
 
};

/**
 * Gửi lại OTP cho email đã tồn tại trong cơ sở dữ liệu tạm thời
 * @param {string} email - Email của user
 * @param {string} otp - Mã OTP mới
 * @returns {Promise<boolean>} - Trả về `true` nếu thành công, ngược lại `false`
 */

exports.resendOTP = async (email, otp) => {
  try {
    // Check xem user còn trong thời gian đăng ký không
    let isValid = await isTempUserExists(email,otp)

    if(!isValid) {
      return false;
    }
    // Nếu còn thì tiến hành gửi OTP mới
    await sendOTPUtils.sendOtpEmail(email, otp);
    return true;
  } catch (error) {
    console.error("Error sending OTP:", error);
  }
};

/**
 * Xác thực OTP của người dùng và tạo tài khoản mới nếu OTP hợp lệ
 * @param {string} email - Email của user
 * @param {string} otp - OTP của user
 * @returns {Promise<boolean>} - Trả về `true` nếu OTP hợp lệ, ngược lại `false`
 */
exports.verifyOtp = async (email, otp) => {
  try {
    let message;
    let success;
    const tempUser = await TempUser.findOne({ userEmail: email });

    if(!tempUser) {
      success = false;
      message = "OTP đã hết hạn, vui lòng đăng ký lại"
      return {success,message};

    }

    if (tempUser.otp !== otp) {
      success = false;
      message = "Vui lòng kiểm tra lại mã OTP"
      return {success,message};
    }

    await createUser({
      email: tempUser.userEmail,
      username: tempUser.username,
      password: tempUser.password,
    });

    await TempUser.deleteOne({ userEmail: email });

    success = true
    message = "Đăng ký thành công"
    return {success,message};
  } catch (error) {
    console.error("Error in verifyOtp controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Tạo người dùng mới và giỏ hàng liên kết
 * @param {object} userData - Thông tin user điền từ client
 * @param {string} userData.email - Email của người dùng
 * @param {string} userData.username - Username của người dùng
 * @param {string} userData.password - Mật khẩu của người dùng (chưa mã hóa)
 * @returns {Promise<object>} - Trả về thông tin người dùng mới tạo
 */
createUser = async ({ email, username, password }) => {
  const newUser = new User({
    username,
    password: password,
    userEmail: email,
  });

  await newUser.save();

  const newCart = new Cart({
    userId: newUser._id,
  });

  await newCart.save();

  return newUser;
};

/**
 * Xác thực người dùng dựa trên username hoặc email và mật khẩu
 * @param {string} loginkey - Username hoặc email của người dùng
 * @param {string} password - Mật khẩu của người dùng
 * @returns {Promise<object|null>} - Trả về thông tin người dùng nếu xác thực thành công, ngược lại trả về null
 */
exports.authenticateUser = async (loginkey, password) => {
  let success;
  let message;
  const existingUser = await User.findOne({
    $or: [{ username: loginkey }, { userEmail: loginkey }],
  });

  if (!existingUser) {
    success = false;
    message = "Tài khoản không tồn tại";
    return {success,message}

  };

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);
  if (!isPasswordValid) {
    success = false;
    message = "Sai mật khẩu"
    return {success,message}
  };
  success = true;
  message = "Đăng nhập thành công, về trang home trong 3s"
  return {success,message,existingUser};
};

/**
 * Tạo JWT token
 * @param {string} userId - ID của người dùng
 * @param {string} secret - JWT secret key
 * @param {string} expiresIn - Thời gian hết hạn của token
 * @returns {string} - Trả về JWT token
 */
exports.generateToken = (userId, secret, expiresIn) => {
  return jwt.sign({ id: userId }, secret, { expiresIn });
};

/**
 * Tạo refresh token
 * @param {string} userId - ID của người dùng
 * @param {string} secret - JWT refresh secret key
 * @param {string} expiresIn - Thời gian hết hạn của refresh token
 * @returns {string} - Trả về refresh token
 */
exports.generateRefreshToken = (userId, secret, expiresIn) => {
  return jwt.sign({ id: userId }, secret, { expiresIn });
};

/**
 * Xác minh refresh token
 * @param {string} refreshToken - Refresh token cần xác minh
 * @param {string} secret - JWT refresh secret key
 * @returns {object|null} - Trả về payload nếu token hợp lệ, ngược lại trả về null
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
 * @returns {string} - Trả về JWT token mới
 */
exports.generateToken = (userId, secret, expiresIn) => {
  return jwt.sign({ id: userId }, secret, { expiresIn });
};

/**
 * Tạo refresh token mới
 * @param {string} userId - ID người dùng
 * @param {string} secret - JWT refresh secret key
 * @param {string} expiresIn - Thời gian hết hạn của refresh token
 * @returns {string} - Trả về refresh token mới
 */
exports.generateRefreshToken = (userId, secret, expiresIn) => {
  return jwt.sign({ id: userId }, secret, { expiresIn });
};
