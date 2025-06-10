const { authentication } = require("../middlewares/auth.middleware");

const router = require("express").Router();

router.get("/", (req, res) => {
  res.status(200).json({
    message: "Stockify API",
    version: "1.0.0",
    team: ["Muh. Zainal Abidin", "Moses Simanungkalit", "Abdul Hafizh"],
  });
});

router.use(require("./user.routes"));
router.use("/inventory", authentication, require("./inventory.routes"));
router.use("/orders", authentication, require("./order.routes"));
router.use("/driver", authentication, require("./driver.routes"));
router.use("/outlet", authentication, require("./outlet.routes"));

module.exports = router;
