const express = require("express");
const handler = require("../momo/payment"); 
const router = express.Router();

router.post('/', handler);

module.exports = router;
