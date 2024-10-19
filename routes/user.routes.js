const express = require("express");
const router = express.Router();
const userController = require("../controller/user-controller");

// get user by ID
router.get("/:id", userController.getUserById);

// get all users
router.get('/', userController.getAllUsers);

// update user information by ID
router.put('/', userController.updateUserById);


module.exports = router;
