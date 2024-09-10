const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/images/products"));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const checkFile = (req, file, cb) => {
  if (!file.originalname.match(/\.(png|jpg|webp|gif)$/)) {
    return cb(new Error("Invalid file format"));
  }

  return cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: checkFile });

module.exports = upload;
