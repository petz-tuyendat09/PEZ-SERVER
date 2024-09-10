const express = require("express");
const router = express.Router();

const authController = require("../controller/auth-controller");
const passport = require("passport");

router.post("/register", authController.registerUser);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);

// === Google Auth ===
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // Successful authentication, send user and token to the client

    req.session.refreshToken = req.user.refreshToken; // Save refreshToken in session

    res.json({
      user: req.user.user,
      token: req.user.token,
    });
  }
);

router.get(
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
