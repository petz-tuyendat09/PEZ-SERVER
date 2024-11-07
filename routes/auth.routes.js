const express = require("express");
const router = express.Router();

const authController = require("../controller/auth-controller");
const passport = require("passport");

router.post("/signup", authController.registerUser);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOTP);
router.post("/forgot-password", authController.forgotPassord);
router.post(
  "/verify-otp-forget-password",
  authController.verifyOtpForgetPassword
);
router.post("/reset-password", authController.resetPassword);

// === Google Auth ===
router.post("/google", authController.loginWithGoogle);

router.post(
  "/protected",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.status(200).send({
      success: true,
      user: {
        username: req.user.username,
        role: req.user.userRole,
      },
    });
  }
);

module.exports = router;
