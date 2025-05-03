const InventoryController = require("../controllers/inventory.controller");

const inventory = require("express").Router();

inventory.get("/", InventoryController.getInventories);
inventory.post("/", InventoryController.createInventory);
inventory.patch("/:id", InventoryController.updateInventory);
inventory.delete("/:id", InventoryController.deleteInventory);

module.exports = inventory;
