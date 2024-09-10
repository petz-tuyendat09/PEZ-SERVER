const mongoose = require("mongoose");

require("dotenv").config({ path: ".env" });

// Connect MongoDB

mongoose
  .connect(process.env.DATABASE)
  .then(() => console.log("Sucesses Connect Database 😭😭 "));

mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
mongoose.connection.on("error", (err) => {
  console.error(`🚫 Error → : ${err.message}`);
});

// Start App
const app = require("./app");

app.set("port", process.env.PORT || 80);

const server = app.listen(app.get("port"), () => {
  console.log(`Express running → On PORT : ${server.address().port}`);
});
