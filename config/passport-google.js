var GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
require("dotenv").config({ path: ".env" });
const passport = require("passport");
const jwt = require("jsonwebtoken");
const Cart = require("../models/Cart");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GG_CLIENT_ID,
      clientSecret: process.env.GG_CLIENT_SECRET,
      callbackURL: "http://localhost:8888/api/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        const googleId = profile.id;
        const displayName = profile.displayName;
        const email = profile.emails[0].value;

        let user = await User.findOne({ userEmail: email });

        if (user) {
          user.googleId = googleId;
          await user.save();
        } else {
          const newCart = new Cart();
          await newCart.save();

          user = await new User({
            googleId: googleId,
            username: email,
            userEmail: email,
            userActive: true,
            displayName: displayName,
            userCart: newCart._id,
          }).save();
        }

        // Tạo token và refreshToken
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "1m", // Set the token expiration time
        });

        const refreshToken = jwt.sign(
          { id: user._id },
          process.env.JWT_REFRESH_SECRET,
          {
            expiresIn: "365d",
          }
        );

        return done(null, { user, token, refreshToken });
      } catch (err) {
        return done(err, false);
      }
    }
  )
);
