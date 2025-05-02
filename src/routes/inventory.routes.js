const InventoryController = require("../controllers/inventory.controller");

const inventory = require("express").Router();

inventory.get("/inventory", InventoryController.getInventories);
inventory.post("/inventory", InventoryController.createInventory);
inventory.patch("/inventory/:id", InventoryController.updateInventory);
inventory.delete("/inventory/:id", InventoryController.deleteInventory);

module.exports = inventory;
