const express = require("express");
const path = require("path");
const session = require("express-session");
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const cookieParser = require("cookie-parser");
const passport = require("passport");
const cors = require("cors");
const MongoStore = require("connect-mongodb-session")(session);
require("./utils/checkBooking");

// Mongo Store

const store = new MongoStore({
  uri: "mongodb://localhost:27017/asm-react",
  collection: "session",
});

// === Passport Config ===
require("./config/passport");
require("./config/passport-google");

// === Router Config ===
const productRouter = require("./routes/product.routes");
const authRouter = require("./routes/auth.routes");
const categoriesRouter = require("./routes/categories.routes");
const subCategories = require("./routes/subcategories.routes");
const userRouter = require("./routes/user.routes");
const cartRouter = require("./routes/cart.routes");
const voucherRouter = require("./routes/voucher.routes");
const servicesRouter = require("./routes/services.routes");
const bookingRouter = require("./routes/booking.routes");
const orderRouter = require("./routes/orders.routes");
const statsOrderRouter = require("./routes/stats.order.routes");
const statsBookingRouter = require("./routes/stats.booking.routes");
const paymentRouter = require("./routes/payment.routes");
const statsRouter = require("./routes/stats.routes");
const shopRouter = require("./routes/shop.routes");
require("dotenv").config({ path: ".env" });

// Create express app
const app = express();

app.use("/public", express.static(path.join(__dirname, "public/")));

// === Create Session ===
app.use(cookieParser());
app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET,
    key: process.env.KEY,
    resave: false,
    store: store,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    },
  })
);

// === Using CORS ===
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://petz-zeta.vercel.app",
    ],
    credentials: true,
  })
);

// === Initialize passport ===
app.use(passport.initialize());

// === Router ===

app.use(jsonParser);

app.use("/api/product", productRouter);
app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/subcategories", subCategories);
app.use("/api/users", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/voucher", voucherRouter);
app.use("/api/services", servicesRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/orders", orderRouter);
app.use("/api/shop", shopRouter);
app.use("/api/orderStats", statsOrderRouter);
app.use("/api/bookingStats", statsBookingRouter);

app.use("/api/payment", paymentRouter);
app.use("/api/stats", statsRouter);

module.exports = app;
