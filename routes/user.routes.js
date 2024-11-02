const express = require("express");
const router = express.Router();
const userController = require("../controller/user-controller");

router.get("/paginate", userController.getAllUsersPaginate);
router.put("/change-role", userController.changeUserRole);
router.get("/voucher-held", userController.getVoucherHeld);
router.get("/", userController.getAllUsers);
router.put("/", userController.updateUserById);
router.post("/test", userController.test);
router.delete("/:id", userController.deleteAllByUser);
router.get("/:id", userController.getUserById);

module.exports = router;
