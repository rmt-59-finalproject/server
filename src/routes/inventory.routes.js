const InventoryController = require("../controllers/inventory.controller");

const inventory = require("express").Router();

inventory.post("/", InventoryController.createInventory);
inventory.get("/", InventoryController.getInventories);
inventory.get("/:id", InventoryController.getInventoryById);
inventory.patch("/:id", InventoryController.updateInventory);
inventory.delete("/:id", InventoryController.deleteInventory);

module.exports = inventory;
