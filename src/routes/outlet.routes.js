const OutletController = require("../controllers/outlet.controller");
const { authOutlet } = require("../middlewares/auth.middleware");
const outlet = require("express").Router();

outlet.get("/orders", authOutlet, OutletController.getAllOrders);
outlet.get("/orders/:id", authOutlet, OutletController.getOrdersById);
outlet.patch(
  "/orders/:id",
  authOutlet,
  OutletController.updateItemStatusByOutlet
);

module.exports = outlet;
