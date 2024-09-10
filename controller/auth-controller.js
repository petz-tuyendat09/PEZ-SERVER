const User = require("../models/User");
const Cart = require("../models/Cart");
const authService = require("../services/authServices");

require("dotenv").config({ path: ".env" });

/**
 * Đăng ký người dùng mới
 * @param {object} req
 * @param {object} res
 * @returns {Promise<void>}
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
    const isEmailExists = await userService.isEmailExists(email);
    if (isEmailExists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Kiểm tra username đã tồn tại chưa
    const isUsernameExists = await userService.isUsernameExists(username);
    if (isUsernameExists) {
      return res.status(409).json({ message: "Username already exists" });
    }

    // Tạo người dùng mới
    const newUser = await userService.createUser({ email, username, password });

    // Trả về phản hồi thành công
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.userEmail,
      },
    });
  } catch (error) {
    console.error("Error in registerUser controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Đăng nhập người dùng
 * @param {object} req
 * @param {object} res
 * @returns {Promise<void>}
 */

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Xác thực người dùng
    const existingUser = await authService.authenticateUser(
      identifier,
      password
    );

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
      secure: false, // Đặt thành true nếu trang web của bạn sử dụng HTTPS
      maxAge: 365 * 24 * 60 * 60 * 1000, // Thời gian tồn tại của cookie (1 năm)
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
 * @param {object} req
 * @param {object} res
 * @returns {Promise<void>}
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
      secure: false, // Đặt thành true nếu trang web của bạn sử dụng HTTPS
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 năm
    });

    // Trả về token mới
    return res.status(200).json({ token: newToken }).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
