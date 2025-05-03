const router = require("express").Router();

router.get("/", (req, res) => {
  res.status(200).json({
    message: "Stockify API",
    version: "1.0.0",
  });
});

router.use(require('./user.routes'));
router.use(require("./inventory.routes"));
router.use('/orders', require('./order.routes'));

module.exports = router;