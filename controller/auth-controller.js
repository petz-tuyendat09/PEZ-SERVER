// app/controllers/authController.js

const authService = require("../services/authServices");
const sendOTPUtils = require("../utils/sendOTP");
require("dotenv").config({ path: ".env" });

/**
 * Đăng ký người dùng mới
 * @param {object} req - Yêu cầu từ client chứa thông tin email, username và password
 * @param {object} res - Phản hồi gửi lại client
 * @returns {Promise<void>} - Trả về phản hồi xác nhận OTP đã được gửi
 */
exports.registerUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Kiểm tra đầu vào hợp lệ
    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ message: "Email, Username and Password are required" });
    }

    // Kiểm tra email đã tồn tại chưa
    const isEmailExists = await authService.isEmailExists(email);
    if (isEmailExists) {
      return res.status(409).json({ message: "Email đã tồn tại" });
    }

    // Kiểm tra username đã tồn tại chưa
    const isUsernameExists = await authService.isUsernameExists(username);
    if (isUsernameExists) {
      return res.status(409).json({ message: "Tên đăng nhập đã tồn tại" });
    }

    // Tạo OTP và gửi email
    const otp = await sendOTPUtils.generateOTP();
    sendOTPUtils.sendOtpEmail(email, otp);

    // Lưu thông tin người dùng tạm thời
    const result = await authService.saveTempUser({
      email,
      username,
      password,
      otp,
    });
    if (result) {
      return res.status(200).json({ message: "OTP sent to email" });
    }
  } catch (error) {
    console.error("Error in registerUser controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Xác thực OTP của người dùng và hoàn tất quá trình đăng ký
 * @param {object} req - Yêu cầu từ client chứa thông tin email và OTP
 * @param {object} res - Phản hồi gửi lại client
 * @returns {Promise<void>} - Trả về phản hồi xác nhận người dùng đã được tạo
 */
exports.verifyOtp = async (req, res) => {
  const { email, otpCode } = req.body;
  try {
    const { success, message } = await authService.verifyOtp(email, otpCode);
    if (!success) {
      return res.status(401).json({ message: message });
    }
    return res.status(201).json({ message: message });
  } catch (error) {
    console.error("Error in OTP verification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Gửi lại OTP cho người dùng
 * @param {object} req - Yêu cầu từ client chứa thông tin email
 * @param {object} res - Phản hồi gửi lại client
 * @returns {Promise<void>} - Trả về phản hồi xác nhận OTP đã được gửi lại
 */
exports.resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const otp = await sendOTPUtils.generateOTP();
    let result = await authService.resendOTP(email, otp);

    if (!result) {
      return res.status(401).json({ message: "Đã quá thời gian gửi lại OTP" });
    }
    return res.status(201).json({ message: "Đã gửi OTP, vui lòng check Mail" });
  } catch (error) {
    console.error("Error in resend OTP:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Đăng nhập người dùng
 * @param {object} req - Yêu cầu từ client chứa thông tin đăng nhập
 * @param {object} res - Phản hồi gửi lại client
 * @returns {Promise<void>} - Trả về phản hồi chứa token và thông tin người dùng
 */
exports.login = async (req, res) => {
  try {
    const { loginkey, password } = req.body;

    // Xác thực người dùng
    const { success, message, existingUser } =
      await authService.authenticateUser(loginkey, password);

    if (!success) {
      return res.status(401).json({ message: message });
    }

    // Tạo JWT token và refresh token
    const token = authService.generateToken(
      existingUser._id,
      process.env.JWT_SECRET,
      "5s"
    );
    const refreshToken = authService.generateRefreshToken(
      existingUser._id,
      process.env.JWT_REFRESH_SECRET,
      "365d"
    );

    const user = { ...existingUser._doc };
    delete user.password;
    delete user.userOrders;
    delete user.userShift;

    return res
      .status(200)
      .json({ canLogin: true, user, token, refreshToken })
      .end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Làm mới JWT token
 * @param {object} req - Yêu cầu từ client chứa refresh token
 * @param {object} res - Phản hồi gửi lại client
 * @returns {Promise<void>} - Trả về phản hồi chứa JWT token mới
 */

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: "Unauthorized" });
    // Xác minh refresh token
    const payload = authService.verifyRefreshToken(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    if (!payload) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    // Tạo JWT token và refresh token mới
    const newToken = authService.generateToken(
      payload.id,
      process.env.JWT_SECRET,
      "5s"
    );
    const newRefreshToken = authService.generateRefreshToken(
      payload.id,
      process.env.JWT_REFRESH_SECRET,
      "365d"
    );

    return res
      .status(200)
      .json({ token: newToken, refreshToken: newRefreshToken })
      .end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.loginWithGoogle = async (req, res) => {
  try {
    const { googleId, displayName, email } = req.body;

    const { user, token, refreshToken } = await authService.loginWithGoogle({
      googleId,
      displayName,
      email,
    });

    return res.status(200).json({
      canLogin: true,
      message: "Đăng nhập thành công",
      data: {
        user,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Error in loginWithGoogle controller:", error);
    return res.status(500).json({
      canLogin: false,
      message: "Đã xảy ra lỗi trong quá trình đăng nhập",
    });
  }
};

exports.forgotPassord = async (req, res) => {
  try {
    const { email } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const isEmailExists = await authService.isEmailExists(email);
    if (!isEmailExists) {
      return res.status(409).json({ message: "Email không tồn tại" });
    }

    // Tạo OTP và gửi email
    const otp = await sendOTPUtils.generateOTP();
    sendOTPUtils.sendOtpEmail(email, otp);

    // Lưu thông tin người dùng tạm thời
    const result = await authService.saveTempUser({
      email,
      otp,
    });
    if (result) {
      return res.status(200).json({ message: "OTP sent to email" });
    }
  } catch (error) {
    console.error("Error in forgotPassord controller:", error);
    return res.status(500).json({
      canLogin: false,
      message: "Đã xảy ra lỗi trong quá trình đăng nhập",
    });
  }
};

exports.verifyOtpForgetPassword = async (req, res) => {
  const { email, otpCode } = req.body;
  try {
    const { success, message } = await authService.verifyOtpForgetPassword({
      email,
      otpCode,
    });
    if (!success) {
      return res.status(401).json({ message: message });
    }
    return res.status(201).json({ message: message });
  } catch (error) {
    console.error("Error in OTP verification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  console.log(newPassword);
  try {
    const { success, message } = await authService.resetPassword({
      email,
      newPassword,
    });
    if (!success) {
      return res.status(401).json({ message: message });
    }
    return res.status(201).json({ message: message });
  } catch (error) {
    console.error("Error in OTP verification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
