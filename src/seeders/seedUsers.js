require("dotenv").config();
const { ObjectId } = require("mongodb");
const db = require("../config/mongodb");

(async function seedData() {
  try {
    const collection = db.collection("users");

    await collection.deleteMany({});

    const data = require("../data/users.json");

    const convertedData = data.map((item) => ({
      ...item,
      _id: new ObjectId(item._id),
    }));

    const result = await collection.insertMany(convertedData);
    console.log(`${result.insertedCount} documents inserted`);
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    process.exit(0)
  }
})();