require("dotenv").config();
const db = require("../config/mongodb");

async function seedData() {
  try {
    const collection = db.collection("products");

    const data = require("../data/products.json");

    const convertedData = data.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }));

    const result = await collection.insertMany(convertedData);
    console.log(`${result.insertedCount} documents inserted`);
  } catch (error) {
    console.error("Seeding failed:", error);
  }
}

seedData();
