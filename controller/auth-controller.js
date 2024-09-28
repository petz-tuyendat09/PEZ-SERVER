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
      return res.status(409).json({ message: "Email already exists" });
    }

    // Kiểm tra username đã tồn tại chưa
    const isUsernameExists = await authService.isUsernameExists(username);
    if (isUsernameExists) {
      return res.status(409).json({ message: "Username already exists" });
    }

    // Tạo OTP và gửi email
    const otp = await sendOTPUtils.generateOTP();
    await sendOTPUtils.sendOtpEmail(email, otp);

    // Lưu thông tin người dùng tạm thời
    await authService.saveTempUser({ email, username, password, otp });

    // Trả về phản hồi thành công
    return res.status(200).json({ message: "OTP sent to email" });
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
  const { email, otp } = req.body;
  try {
    await authService.verifyOtp(email, otp);
    return res.status(201).json({ message: "User registered successfully" });
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
      return res.status(401).json({ message: "OTP resend time expired" });
    }

    return res.status(201).json({ message: "OTP resend" });
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
    const { identifier, password } = req.body;

    // Xác thực người dùng
    const existingUser = await authService.authenticateUser(identifier, password);

    if (!existingUser) {
      return res.status(401).json({ message: "Wrong password or username" });
    }

    // Tạo JWT token và refresh token
    const token = authService.generateToken(
      existingUser._id,
      process.env.JWT_SECRET,
      "30s"
    );
    const refreshToken = authService.generateRefreshToken(
      existingUser._id,
      process.env.JWT_REFRESH_SECRET,
      "365d"
    );

    const user = {
      username: existingUser.username,
      userRole: existingUser.userRole,
    };

    // Thiết lập cookie cho token và refresh token
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ canLogin: true, user, token }).end();
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
    const refreshToken = req.body.refreshToken.value;

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
      "1m"
    );
    const newRefreshToken = authService.generateRefreshToken(
      payload.id,
      process.env.JWT_REFRESH_SECRET,
      "365d"
    );

    // Thiết lập cookie cho refresh token mới
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false,
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ token: newToken }).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
