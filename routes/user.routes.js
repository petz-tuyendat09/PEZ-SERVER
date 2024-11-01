const express = require("express");
const router = express.Router();
const userController = require("../controller/user-controller");

router.get("/paginate", userController.getAllUsersPaginate);
router.get("/voucher-held", userController.getVoucherHeld);

// get user by ID
router.get("/:id", userController.getUserById);

// get all users
router.get("/", userController.getAllUsers);

// update user information by ID
router.put("/", userController.updateUserById);
router.put("/change-role", userController.changeUserRole);

module.exports = router;
