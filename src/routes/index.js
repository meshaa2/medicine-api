const express = require("express");
const router = express.Router();

router.use("/medicines", require("./medicines.routes"));
router.use("/transactions", require("./transactions.routes"));

module.exports = router;

